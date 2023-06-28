import { ChatCompletionRequestMessage } from 'openai'
import { Control } from './command'
import { AskQuestionFn, askQuestion } from './question'
import { AbortEvent } from './exceptions'

export type AskUser = () => Promise<ChatCompletionRequestMessage | Control>

export const $createAskUser = (opts: any) => async (): Promise<ChatCompletionRequestMessage | Control> => {
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

export type HandleUserOpts = {
  askUser?: AskUser
  askQuestion?: AskQuestionFn
}

export type HandleUserParams = {
  opts: HandleUserOpts
}

export const getUserMessage = async (opts: HandleUserOpts): Promise<ChatCompletionRequestMessage | undefined> => {
  const askUser = createAskUser(opts)
  if (!askUser) return
  const userMessage = await askUser()
  console.log({ userMessage })
  if (userMessage == Control.ABORT) {
    throw new AbortEvent('user aborted')
  }
  return userMessage
}

export const createAskUser = (opts: any): AskUser => {
  if (opts.askUser) return opts.askUser
  return $createAskUser(opts)
}
