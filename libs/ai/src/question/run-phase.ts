import { CreateSystemMsgOpts, RunTaskMessageParams, RunTaskOpts, RunTaskParams as RunTaskParams } from './types'
import { ChatCompletionRequestMessage } from 'openai'
import { Control } from './command'
import { IPhaseTask } from '@gpt-team/phases'
import { promptAiAndUser } from './prompt-ai'
import { AbortError } from './exceptions'

export type RunPhaseStep = (opts: RunTaskOpts) => Promise<ChatCompletionRequestMessage[] | undefined>

export const createGetPrompt = (message: string | undefined) => async () => message

export const createGetNextTaskMessage = (opts: any) => async () => opts.task.nextMessage()

export const createGetSystemRequestMessage =
  (opts: CreateSystemMsgOpts) =>
  (message: string): ChatCompletionRequestMessage => {
    if (!opts.ai) {
      throw new AbortError('Missing ai')
    }
    // TODO: move helper method out from ai
    return opts.ai.fsystem(message)
  }

export async function runTask({ task, opts }: RunTaskParams): Promise<ChatCompletionRequestMessage[]> {
  console.log('run task')
  let messages: ChatCompletionRequestMessage[] = []
  try {
    let shouldContinue = true
    while (shouldContinue) {
      const taskMessage = await task.nextMessage()
      if (!taskMessage) {
        // log
        break
      }
      const msgs = await runTaskMessage({
        taskMessage,
        opts,
      })
      // TODO: publish to delivery channel (or perhaps from within runTaskMessage before returning?)

      messages.push(...msgs)
    }
  } catch (_) {
    // log abort or error
  }
  return messages
}

export async function runTaskMessage({
  taskMessage,
  opts,
}: RunTaskMessageParams): Promise<ChatCompletionRequestMessage[]> {
  let messages: ChatCompletionRequestMessage[] = []
  try {
    const getSystemRequestMessage = opts.getSystemRequestMessage || createGetSystemRequestMessage(opts)
    opts.getPrompt = opts.getPrompt || createGetPrompt(taskMessage)
    const { getPrompt } = opts
    if (!taskMessage) throw new AbortError('missing task message')
    const chatMsg = getSystemRequestMessage(taskMessage)
    messages = [chatMsg]
    if (!getPrompt) {
      return messages
    }
    let prompt: any = taskMessage || getPrompt()

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
