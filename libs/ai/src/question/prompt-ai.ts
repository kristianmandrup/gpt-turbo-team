import { ChatCompletionRequestMessage } from 'openai'
import { AskQuestionFn, askQuestion } from './question'
import { Control, getControl } from './command'
import { AiResponse, createGetAiResponse } from '../response/response'
import { getLastResponseMessage } from '../message'
import { AskUser, HandleUserOpts, getUserMessage } from './user'
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

export type IAiAndUserRunner = {
  run(): Promise<ChatCompletionRequestMessage[]>
}

export class AiAndUserRunner {
  protected messages: ChatCompletionRequestMessage[] = []
  protected prompt?: string
  protected opts?: any

  constructor({ messages, prompt, opts }: PromptAiOpts) {
    this.messages = messages
    this.prompt = prompt
    this.opts = opts
  }

  async run(): Promise<ChatCompletionRequestMessage[]> {
    const { opts, messages, prompt } = this
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
      const userRunner = new UserRunner(opts)
      // User can terminate further processing by writing command to abort (q = quit)
      const userMessage = await userRunner.run()
      userMessage && messages.push(userMessage)
    } catch (_) {}
    return messages
  }
}

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

export type IUserRunner = {
  run(): Promise<ChatCompletionRequestMessage | undefined>
}

export class UserRunner {
  opts: HandleUserOpts

  constructor(opts: HandleUserOpts) {
    this.opts = opts
  }

  async run(): Promise<ChatCompletionRequestMessage | undefined> {
    const askUser = this.createAskUser()
    if (!askUser) return
    const userMessage = await askUser()
    console.log({ userMessage })
    if (userMessage == Control.ABORT) {
      throw new AbortEvent('user aborted')
    }
    return userMessage
  }

  createAskUser(): AskUser {
    const { opts } = this
    if (opts.askUser) return opts.askUser
    return this._createAskUser()
  }

  _createAskUser() {
    return async (): Promise<ChatCompletionRequestMessage | Control> => {
      const { opts } = this
      const question = opts.askQuestion || askQuestion
      console.log('createUserMessage')
      let user = await question('(answer in text, or "q" to move on)\n')
      // console.log(`User input: ${user}`);
      if (!user || user === 'q') {
        return Control.ABORT
      }
      user +=
        '\n\n' +
        'Is anything else unclear? If yes, only answer in the form:\n' +
        '{remaining unclear areas} remaining questions.\n' +
        '{Next question}\n' +
        'If everything is sufficiently clear, only answer "no".'
      return { role: 'user', content: user }
    }
  }
}
