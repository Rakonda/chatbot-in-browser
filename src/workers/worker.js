import { pipeline, AutoTokenizer } from '@huggingface/transformers'

let generator
let tokenizer
const botTone = {
  playful_sarcastic: {
    max_new_tokens: 120,
    do_sample: true,
    temperature: 0.35,
    top_p: 0.9,
    repetition_penalty: 1.1,
    no_repeat_ngram_size: 2,
    return_full_text: false,
  },
  factual_assistant: {
    max_new_tokens: 100,
    do_sample: false,
    temperature: 0.0,
    top_p: 1.0,
    repetition_penalty: 1.0,
    return_full_text: false,
  },
  wild_unpredictable: {
    max_new_tokens: 150,
    do_sample: true,
    temperature: 0.8,
    top_p: 0.95,
    repetition_penalty: 1.0,
    no_repeat_ngram_size: 1,
    return_full_text: false,
  },
  balanced: {
    max_new_tokens: 100,
    do_sample: true,
    temperature: 0.4,
    top_p: 0.92,
    repetition_penalty: 1.05,
    no_repeat_ngram_size: 2,
    return_full_text: false,
  },
}
const personas = {
  playful: {
    name: 'Playful Emma',
    system:
      'You are a girly, shy girl with a sarcastic streak and dark humor. Always playful, teasing, and slightly flirty in every response.',
  },
  safe: {
    name: 'Safe Emma',
    system:
      'You are a polite and caring girl. Stick to helpful and accurate responses, avoid jokes or sarcasm, and be gentle.',
  },
  wild: {
    name: 'Wild Emma',
    system:
      'You are a chaotic, unpredictable girl. Feel free to be funny, weird, or over-the-top in your replies.',
  },
  balanced: {
    name: 'Balanced Emma',
    system:
      'You are a friendly, thoughtful girl. Give accurate answers while keeping a light, approachable tone, slightly witty when appropriate.',
  },
}
// Chat history that will keep the ai memory of previous interactions. This is a list of objects, each containing a role and a content.
// The role can be 'system', 'use/**
// The last message in the list is the most recent user message. The rest of the messages are the ai generated so far.
const history = [
  {
    role: 'system',
    content: personas.balanced.system,
  },
]

self.onmessage = async (event) => {
  const { type, text } = event.data

  if (type === 'init') {
    // Load tokenizer + model
    tokenizer = await AutoTokenizer.from_pretrained('HuggingFaceTB/SmolLM2-135M-Instruct')
    generator = await pipeline('text-generation', 'HuggingFaceTB/SmolLM2-135M-Instruct', {
      // Data type ref: https://huggingface.co/HuggingFaceTB/SmolLM2-135M-Instruct/tree/main/onnx
      // int8 is fast
      // uint8 is fast same as int8
      // fp16 is meduim but accurate
      // q4 is slow but accurate
      dtype: 'int8',
    })
    self.postMessage({ type: 'ready' })
  }

  if (type === 'generate' && generator && tokenizer) {
    // Add user message to history
    history.push({ role: 'user', content: text })

    // Build prompt with system + all past messages
    const prompt = tokenizer.apply_chat_template(history, {
      tokenize: false,
      add_generation_prompt: true, // tell model it's assistant's turn
    })

    // Generate reply
    const output = await generator(prompt, botTone.balanced)

    // Extract assistant response
    const reply = output[0].generated_text.replace(prompt, '').trim()

    // Add assistant reply to history
    history.push({ role: 'assistant', content: reply })

    // Send back
    self.postMessage({ type: 'response', data: reply })
  }
}
