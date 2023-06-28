import { RunTaskMessageParams } from './types'
import { ChatCompletionRequestMessage } from 'openai'
import { promptAiAndUser } from '../question/prompt-ai'
import { AbortError } from '../question/exceptions'
import { CreateSystemMsgOpts, createGetPrompt, createGetSystemRequestMessage, fsystem } from '../question/functions'

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

export interface ITaskMessageRunner {
  runTaskMessage({ taskMessage, opts }: RunTaskMessageParams): Promise<ChatCompletionRequestMessage[]>
}

export class TaskMessageRunner {
  constructor(private options: any = {}) {}

  createGetPrompt(message: string | undefined) {
    return async () => message
  }

  createGetSystemRequestMessage =
    (opts: CreateSystemMsgOpts) =>
    (message: string, options: any): ChatCompletionRequestMessage[] => {
      if (!opts.ai) {
        throw new AbortError('Missing ai')
      }
      // TODO: move helper method out from ai
      const chatMsg = fsystem(message)
      return [chatMsg]
    }

  async runTaskMessage({ taskMessage, opts }: RunTaskMessageParams): Promise<ChatCompletionRequestMessage[]> {
    opts = {
      ...this.options,
      ...opts,
    }
    let messages: ChatCompletionRequestMessage[] = opts.messages || []
    try {
      const getSystemRequestMessages = opts.getSystemRequestMessages || this.createGetSystemRequestMessage(opts)
      opts.getPrompt = opts.getPrompt || this.createGetPrompt(taskMessage)
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
}
