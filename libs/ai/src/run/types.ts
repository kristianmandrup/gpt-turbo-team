import { IPhaseTask } from '@gpt-team/phases'
import { IAIToolkit } from '../ai'
import { ChatCompletionRequestMessage } from 'openai'
import { CreateSystemMsgOpts } from '../question'

export type OutputOpts = {
  name: string
  type: string
  language?: string
  ext?: string
}

export type RunTaskMessage = (params: RunTaskMessageParams) => Promise<ChatCompletionRequestMessage[]>

export type GetPrompt = () => Promise<string | undefined>

export type GetSystemRequestMessage = (message?: string, opts?: RunTaskOpts) => ChatCompletionRequestMessage[]

export type CreateGetSystemRequestMessage = (opts: CreateSystemMsgOpts) => GetSystemRequestMessage

export type RunTaskFn = (opts: RunTaskOpts) => Promise<ChatCompletionRequestMessage[]>

export type RunTaskOpts = {
  ai?: IAIToolkit
  output?: OutputOpts
  inputs?: string[]
  getPrompt?: GetPrompt
  getSystemRequestMessages?: GetSystemRequestMessage
  runTaskMessage?: RunTaskMessage
  config?: any
  messages?: ChatCompletionRequestMessage[]
}

export type RunTaskParams = {
  task: IPhaseTask
  opts: RunTaskOpts
}

export type RunTaskMessageParams = {
  taskMessage: string
  opts: RunTaskOpts
}
