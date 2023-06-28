import { ChatCompletionRequestMessage } from 'openai'
import { createGetAiResponse } from '../response/'
import { getLastResponseMessage } from '../message'
import { getControl, AbortError, AbortEvent } from '../question'

export type IAiRunner = {
  run(): Promise<ChatCompletionRequestMessage[]>
}

export class AiRunner {
  opts: any
  protected messages: ChatCompletionRequestMessage[] = []

  constructor(messages: ChatCompletionRequestMessage[], opts: any) {
    this.messages = messages
    this.opts = opts
  }

  async run() {
    const { opts, messages } = this
    const getAiResponse = createGetAiResponse(opts)
    if (!getAiResponse) {
      throw new AbortError('missing getAiResponse')
    }
    const responseMessages = await getAiResponse({ messages, prompt })
    const aiGeneratedContent = getLastResponseMessage(responseMessages)
    // Ai can terminate further processing by saying no to needing further clarification from user
    let control = getControl(aiGeneratedContent)
    if (control) {
      throw new AbortEvent('AI completed')
    }
  }
}
