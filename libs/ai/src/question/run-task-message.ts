import { RunTaskMessageParams } from './types'
import { ChatCompletionRequestMessage } from 'openai'
import { Control } from './command'
import { promptAiAndUser } from './prompt-ai'
import { AbortError } from './exceptions'
import { createGetPrompt, createGetSystemRequestMessage } from './functions'

export async function runTaskMessage({
  taskMessage,
  opts,
}: RunTaskMessageParams): Promise<ChatCompletionRequestMessage[]> {
  let messages: ChatCompletionRequestMessage[] = opts.messages || []
  try {
    const getSystemRequestMessages = opts.getSystemRequestMessages || createGetSystemRequestMessage(opts)
    opts.getPrompt = opts.getPrompt || createGetPrompt(taskMessage)
    const { getPrompt } = opts
    if (!taskMessage) throw new AbortError('missing task message')
    const systemRequestMsgs = getSystemRequestMessages(taskMessage, opts)
    messages.push(...systemRequestMsgs)
    if (!getPrompt) {
      return messages
    }
    let prompt: any = taskMessage || getPrompt()

    let shouldContinue = true
    // TODO: ...
    while (shouldContinue) {
      messages = await promptAiAndUser({ messages, prompt, opts })
    }
  } catch (_) {
    // log abort or error
  }
  return messages
}
