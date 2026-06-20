/**
 * Ollama Client - Local LLM Integration
 * Port: 11434 (custom)
 */

const OLLAMA_URL = 'http://127.0.0.1:11434'
const DEFAULT_MODEL = 'qwq:32b'
const CODING_MODEL = 'qwen2.5-coder:7b'
const LIGHT_MODEL = 'qwen2.5-coder:1.5b'

interface OllamaResponse {
  model: string
  response: string
  done: boolean
}

class OllamaClient {
  private baseUrl = OLLAMA_URL
  private defaultModel = DEFAULT_MODEL

  async generate(prompt: string, model?: string): Promise<string> {
    const res = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model || this.defaultModel,
        prompt,
        stream: false
      })
    })
    const data: OllamaResponse = await res.json()
    return data.response
  }

  async chat(messages: Array<{ role: string; content: string }>, model?: string): Promise<string> {
    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model || this.defaultModel,
        messages
      })
    })
    const data = await res.json()
    return data.message?.content || ''
  }

  async analyzeCode(code: string): Promise<string> {
    const prompt = `Analyze this code and provide insights:\n\n${code.slice(0, 2000)}`
    return this.generate(prompt, CODING_MODEL)
  }

  async suggestFix(error: string, context: string): Promise<string> {
    const prompt = `Suggest a fix for this error:\nError: ${error}\nContext: ${context.slice(0, 1000)}`
    return this.generate(prompt, CODING_MODEL)
  }

  async generateContent(topic: string): Promise<string> {
    return this.generate(`Generate content about: ${topic}`)
  }

  getModel() { return this.defaultModel }
}

export const ollama = new OllamaClient()