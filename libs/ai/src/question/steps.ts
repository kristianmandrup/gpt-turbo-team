import { DBs } from '@gpt-team/db'
import { PhaseStepOpts } from './types';
import { ChatCompletionRequestMessage } from 'openai';
import { Question } from './question';
import { Control, processCommand as getControl } from './command';
import { AiResponse, createGetAiResponse } from '../response/response';
import { getLastResponseMessage } from '../message';
import { getUserMessage } from './user';
import { AbortError } from './exceptions';

// export async function run(ai: IAIToolkit, dbs: DBs) {
//   const sysPrompt = setupSysPrompt(dbs)
//   const messages = await ai.start(, dbs.input.getItem('main_prompt'));
//   const lastMessage = getLastResponseMessage(messages);
//   if (!lastMessage) return [];
//   await toFiles(dbs.workspace, lastMessage);
//   return messages;
// }


export type RunPhaseStep = (opts: PhaseStepOpts) => Promise<ChatCompletionRequestMessage[] | undefined>

export const createGetUserMsg = (dbs: DBs) => () => dbs.input.getItem('ui_user')


export type PromptAiOpts = {
  aiResponse?: AiResponse
  question?: Question
  messages: ChatCompletionRequestMessage[]
  prompt?: string
  opts?: any
}

// TODO: async mode, should notify user of pending feedback while agent continues
// feedback can then be fed back in to where the agent asked and agent can re-run tasks from there with additional info
export const promptAiAndUser = async ({messages, prompt, opts}: PromptAiOpts): Promise<ChatCompletionRequestMessage[] | Control> => {    
    try {
      const getAiResponse = createGetAiResponse(opts)
      if (!getAiResponse) {
        throw new AbortError('missing getAiResponse')
      }    
      const responseMessages = await getAiResponse({messages, prompt})
      const aiGeneratedContent = getLastResponseMessage(responseMessages)
      // Ai can terminate further processing by saying no to needing further clarification from user
      let control = getControl(aiGeneratedContent)
      if (control) return control;
      // User can terminate further processing by writing command to abort (q = quit)
      const userMessage = await getUserMessage(opts)  
      userMessage && messages.push(userMessage);      
    } catch (_) {
    }
    return messages    
}

// TODO: limit parameters by using opts
export async function runPhaseStep({ai, dbs, task, inputs, getUserMsg, output, config}: PhaseStepOpts): Promise<ChatCompletionRequestMessage[] | undefined> {
  console.log('run phase step')
  // TODO: use inputs and config
  await task.loadMessages();
  const message = await task.nextMessage();
  if (!message) return

  const chatMsg = ai.fsystem(message);
  const messages = [chatMsg];  
  getUserMsg = getUserMsg || createGetUserMsg(dbs)
  
  let prompt: any = getUserMsg();

  let shouldContinue = true
  // TODO: ...
  while (shouldContinue) {
    const opts = {ai, output}
    const result = await promptAiAndUser({messages, prompt, opts})
    if (result == Control.ABORT) {
      shouldContinue = false
    };
  }
  return messages;
}
