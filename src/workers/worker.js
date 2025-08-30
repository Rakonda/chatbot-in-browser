import { pipeline, AutoTokenizer } from '@huggingface/transformers'

let generator
let tokenizer
let totalBytes = 0
let receivedBytes = 0
let fileSizes = new Map() // url -> size
let lastPercent = 0 // last reported %
const originalFetch = globalThis.fetch
const config = {
  botTone: {
    playful_sarcastic: {
      max_new_tokens: 120,
      do_sample: true,
      temperature: 0.6, // Increased for more spontaneous humor
      top_p: 0.9,
      repetition_penalty: 1.1,
      diversity_penalty: 0.5,
      stop_sequences: ['\n\n', 'END'],
      return_full_text: false,
    },
    factual_assistant: {
      max_new_tokens: 80, // Lower for more concise answers
      do_sample: false, // Perfect for facts
      temperature: 0.0,
      top_p: 1.0,
      repetition_penalty: 1.0,
      diversity_penalty: 0.0,
      stop_sequences: ['\n\n', 'END'],
      return_full_text: false,
    },
    wild_unpredictable: {
      max_new_tokens: 150,
      do_sample: true,
      temperature: 0.85,
      top_p: 0.85, // Lowered to cut off nonsense words
      repetition_penalty: 1.15, // Slightly increased to prevent loops
      diversity_penalty: 0.3,
      stop_sequences: ['\n\n', 'END'],
      return_full_text: false,
    },
    balanced: {
      max_new_tokens: 100,
      do_sample: true,
      temperature: 0.45, // Great default. Adjust based on testing.
      top_p: 0.92,
      repetition_penalty: 1.05,
      diversity_penalty: 0.5,
      stop_sequences: ['\n\n', 'END'],
      return_full_text: false,
    },
  },
  personas: {
    playful: {
      name: 'Playful Emma',
      system_prompt: 'A witty, sarcastic, and slightly flirty persona with a knack for dark humor.',
      tone_mapping: 'playful_sarcastic',
      context_memory: true,
    },
    safe: {
      name: 'Safe Emma',
      system_prompt:
        'A polite, empathetic, and reliable persona focused on clear and caring responses.',
      context_memory: true,
    },
    wild: {
      name: 'Wild Emma',
      system_prompt: 'A chaotic, unpredictable, and humorous persona with a flair for the absurd.',
      tone_mapping: 'wild_unpredictable',
      context_memory: true,
    },
    balanced: {
      name: 'Balanced Emma',
      system_prompt: 'A friendly, thoughtful persona with a touch of wit and professionalism.',
      tone_mapping: 'balanced',
      context_memory: true,
    },
  },
}
// Chat history that will keep the ai memory of previous interactions. This is a list of objects, each containing a role and a content.
// The role can be 'system', 'use/**
// The last message in the list is the most recent user message. The rest of the messages are the ai generated so far.
let history = [
  {
    role: 'system',
    content: config.personas.playful.system_prompt,
  },
]

function bytesForHuman(bytes) {
  const units = ['B', 'KB', 'MB', 'GB']
  while (bytes > 1024 && units.length) {
    bytes /= 1024
    units.shift()
  }
  return bytes.toFixed(1) + ' ' + units[0]
}

// --- Progress-friendly fetch wrapper ---
function reportProgress(percent) {
  const rounded = Math.floor(percent) // report only whole %
  if (rounded > lastPercent) {
    lastPercent = rounded
    self.postMessage({
      type: 'download-progress',
      progress: rounded, // clean int 0–100
      fileSize: bytesForHuman(totalBytes),
    })
  }
}

async function fetchWithProgress(url, opts, onProgress) {
  const response = await originalFetch(url, opts)
  if (!response.ok) throw new Error(`Failed to fetch ${url}`)

  const contentLength = +response.headers.get('Content-Length')
  if (!response.body) {
    return response // no streaming available
  }

  // Register file size once
  if (contentLength && !fileSizes.has(url)) {
    fileSizes.set(url, contentLength)
    totalBytes = [...fileSizes.values()].reduce((a, b) => a + b, 0)
  }

  const reader = response.body.getReader()
  let chunks = []

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)

    // Update counters
    receivedBytes += value.length

    // Global %
    const percent = totalBytes ? Math.min(100, (receivedBytes / totalBytes) * 100) : 0
    onProgress(percent)
  }

  return new Response(new Blob(chunks), {
    headers: response.headers,
    status: response.status,
    statusText: response.statusText,
  })
}

// Patch fetch
globalThis.fetch = (url, opts) =>
  fetchWithProgress(url, opts, (percent) => {
    reportProgress(percent)
  })

function setHistoryQuota(limit) {
  const systemMessage = history[0]
  const recentHistory = history.slice(Math.max(1, history.length - limit))
  return [systemMessage, ...recentHistory]
}

function resetHistory() {
  history = [history[0]]
  self.postMessage({ type: 'response', data: 'History reseted' })
}

self.onmessage = async (event) => {
  const { type, text } = event.data

  switch (type) {
    case 'init': {
      // Load tokenizer + model
      tokenizer = await AutoTokenizer.from_pretrained('HuggingFaceTB/SmolLM2-135M-Instruct')
      generator = await pipeline('text-generation', 'HuggingFaceTB/SmolLM2-135M-Instruct', {
        // Data type ref: https://huggingface.co/HuggingFaceTB/SmolLM2-135M-Instruct/tree/main/onnx
        // On CPU:
        // int8 is fast
        // uint8 is fast same as int8
        // fp16 is meduim but accurate
        // q4 is slow but accurate
        dtype: 'q4',
        device: 'webgpu',
      })
      self.postMessage({ type: 'ready' })
      break
    }

    case 'generate': {
      if (!generator || !tokenizer) break

      if (text === 'reset history') {
        resetHistory()
        break
      }

      self.postMessage({ type: 'thinking' })

      // Add user message to history
      history.push({ role: 'user', content: text })

      // Build prompt with system + all past messages
      const prompt = tokenizer.apply_chat_template(history, {
        tokenize: false,
        add_generation_prompt: true, // tell model it's assistant's turn
      })

      // Generate reply
      const output = await generator(prompt, config.botTone.playful_sarcastic)

      // Extract assistant response
      const reply = output[0].generated_text.replace(prompt, '').trim()

      // Add assistant reply to history
      history.push({ role: 'assistant', content: reply })

      // Limit the history log to the last 10 messages
      history = setHistoryQuota(10)

      // Send back
      self.postMessage({ type: 'response', data: reply })

      console.log(history)
      break
    }

    default:
      // Ignore unknown message types
      break
  }
}
