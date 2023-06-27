import { CreateSystemMsgOpts, RunTaskOpts, RunTaskParams as RunTaskParams } from './types'
import { ChatCompletionRequestMessage } from 'openai'
import { Control } from './command'
import { IPhaseTask } from '@gpt-team/phases'
import { promptAiAndUser } from './prompt-ai'
import { AbortError } from './exceptions'

export type RunPhaseStep = (opts: RunTaskOpts) => Promise<ChatCompletionRequestMessage[] | undefined>

const createGetPrompt = (task: IPhaseTask) => async () => task.nextMessage()

export const createGetSystemRequestMessage = (opts: CreateSystemMsgOpts) => (message: string) => {
  if (!opts.ai) {
    throw new AbortError('Missing ai')
  }
  return opts.ai.fsystem(message)
}

export async function runTask({ task, opts }: RunTaskParams): Promise<ChatCompletionRequestMessage[]> {
  console.log('run phase')
  let messages: ChatCompletionRequestMessage[] = []
  try {
    await task.loadMessages()
    const message = await task.nextMessage()
    if (!message) return []
    const getSystemRequestMessage = opts.getSystemRequestMessage || createGetSystemRequestMessage(opts)
    opts.getPrompt = opts.getPrompt || createGetPrompt(task)
    const { getPrompt } = opts
    const chatMsg = getSystemRequestMessage(message, opts)
    messages = [chatMsg]
    if (!getPrompt) {
      return messages
    }
    let prompt: any = getPrompt()

    let shouldContinue = true
    // TODO: ...
    while (shouldContinue) {
      const result = await promptAiAndUser({ messages, prompt, opts })
      if (result == Control.ABORT) {
        shouldContinue = false
      }
    }
  } catch (_) {
    // log abort or error
  }
  return messages
}
