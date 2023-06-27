import { IPhaseTask } from '@gpt-team/phases'
import { IAIToolkit } from '../ai'
import { ChatCompletionRequestMessage } from 'openai'

export type OutputOpts = {
  name: string
  type: string
  language?: string
  ext?: string
}

export type GetPrompt = () => Promise<string | undefined>

export type GetSystemRequestMessage = (message: string, opts?: RunTaskOpts) => ChatCompletionRequestMessage

export type CreateGetSystemRequestMessage = (opts: CreateSystemMsgOpts) => GetSystemRequestMessage

export type CreateSystemMsgOpts = {
  ai?: IAIToolkit
}

export type RunTaskOpts = {
  ai?: IAIToolkit
  output?: OutputOpts
  inputs?: string[]
  getPrompt?: GetPrompt
  getSystemRequestMessage?: GetSystemRequestMessage
  config?: any
}

export type RunTaskParams = {
  task: IPhaseTask
  opts: RunTaskOpts
}
