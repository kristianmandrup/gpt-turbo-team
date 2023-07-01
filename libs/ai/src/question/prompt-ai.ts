import { ChatCompletionRequestMessage } from 'openai'
import { AskQuestionFn } from './question'
import { getControl } from './command'
import { AiResponse, createGetAiResponse } from '../response/response'
import { getLastResponseMessage } from '../message'
import { getUserMessage } from './user'
import { AbortError, AbortEvent } from './exceptions'

export type PromptAiOpts = {
  aiResponse?: AiResponse
  askQuestion?: AskQuestionFn
  messages: ChatCompletionRequestMessage[]
  prompt?: string
  opts?: any
}

// TODO: async mode, should notify user of pending feedback while agent continues
// feedback can then be fed back in to where the agent asked and agent can re-run tasks from there with additional info
export const promptAiAndUser = async ({
  messages,
  prompt,
  opts,
}: PromptAiOpts): Promise<ChatCompletionRequestMessage[]> => {
  try {
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
    // User can terminate further processing by writing command to abort (q = quit)
    const userMessage = await getUserMessage(opts)
    userMessage && messages.push(userMessage)
  } catch (_) {}
  return messages
}
