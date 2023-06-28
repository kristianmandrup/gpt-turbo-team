import { ChatCompletionRequestMessage } from 'openai'
import { runTaskMessage } from './run-task-message'
import { RunTaskParams } from './types'

export async function runTask({ task, opts }: RunTaskParams): Promise<ChatCompletionRequestMessage[]> {
  console.log('run task')
  let messages: ChatCompletionRequestMessage[] = []
  opts.runTaskMessage = opts.runTaskMessage || runTaskMessage
  try {
    let shouldContinue = true
    while (shouldContinue) {
      const taskMessage = await task.nextMessage()
      if (!taskMessage) {
        // log
        break
      }
      const msgs = await opts.runTaskMessage({
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
