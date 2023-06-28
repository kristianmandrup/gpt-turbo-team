import { ChatCompletionRequestMessage } from 'openai'
import { HandleUserOpts, Control } from '../question'
import { AskUser, askQuestion } from '../question'
import { AbortEvent } from '../question'

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
