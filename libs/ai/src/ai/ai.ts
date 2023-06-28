import {
  Configuration,
  OpenAIApi,
  CreateChatCompletionRequest,
  ChatCompletionRequestMessage,
  CreateChatCompletionResponse,
} from 'openai'
import 'dotenv/config'
import { NextOpts } from './types'
import { fsystem, fuser } from '../question'

export const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
})

export type StartParams = { system: string[]; user: string[] }

export class AIToolkit {
  private client: any
  private opts: Record<string, any>

  constructor(opts: Record<string, any>, config?: Configuration) {
    console.log('configure OpenAIAPI with', config || configuration)
    this.client = new OpenAIApi(configuration)
    this.opts = opts
  }

  public start({ system, user }: StartParams): Promise<ChatCompletionRequestMessage[]> {
    const sysMessages = system.map(fsystem)
    const userMessages = user.map(fuser)
    const messages: ChatCompletionRequestMessage[] = [...(sysMessages || []), ...(userMessages || [])]

    return this.next({ messages })
  }

  public async next({ messages, prompt, output }: NextOpts): Promise<ChatCompletionRequestMessage[]> {
    // TODO: use output if present
    if (prompt) {
      const userPromptMessage = fuser(prompt)
      messages.push(userPromptMessage)
    }
    const response = await this.aiResponse(messages)

    let data: CreateChatCompletionResponse = response.data
    const chat = this.parseResponses(data)
    const assistantMessage = this.assistantRequest(chat)
    messages.push(assistantMessage)
    return messages
  }

  chatRequestFor(messages: ChatCompletionRequestMessage[]): CreateChatCompletionRequest {
    return {
      messages,
      model: this.opts.model || 'gpt-3.5-turbo',
      ...this.opts,
    }
  }

  async aiResponse(messages: ChatCompletionRequestMessage[]) {
    try {
      const chatRequest = this.chatRequestFor(messages)
      console.log('calling createChatCompletion with:', chatRequest)
      return await this.client.createChatCompletion(chatRequest)
    } catch (ex) {
      console.error(ex)
      throw ex
    }
  }

  assistantRequest(chat: string[]): ChatCompletionRequestMessage {
    return { role: 'assistant', content: chat.join('') }
  }

  parseResponses(data: CreateChatCompletionResponse) {
    console.log('parsing responses', data.choices)
    const chat: string[] = []
    for (const chunk of data.choices) {
      console.log({ chunk })
      const delta = chunk?.message?.content ?? ''
      console.log(delta)
      chat.push(delta)
    }
    return chat
  }
}
