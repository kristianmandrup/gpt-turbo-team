import { ChatCompletionRequestMessage } from 'openai';
import { Control, createGetLastResponseMessageBy, getLastResponseMessage, promptAi } from '@gpt-team/ai'
// import {expect, jest, test} from '@jest/globals';

describe('promptAi', () => {
    // mock ai.next
    const responseMap: any = {
        no: 'no',
        code: "```function hello() {}```",
    }

    let responseType = 'code';

    const aiResponse = async({ messages }: any): Promise<string | undefined> => {
        const chat = responseMap[responseType].split("\n")
        messages.push({ role: "assistant", content: chat.join("") });
        console.log({messages})
        return getLastResponseMessage(messages)
    }
    const question = async (_:string) => {
        console.log('mock question')
        return 'hello?'
    }

    const getLastResponseMessageByAssistant = createGetLastResponseMessageBy('assistant')

    it('aborts on command: no', async () => {
        const sysMsg: ChatCompletionRequestMessage = { role: "system", content: 'hello' }
        const messages = [sysMsg]
        responseType = 'no'
        const result = await promptAi({aiResponse, question, messages })
        expect(result).toBe(Control.ABORT);
    })    

    it('ai returns code', async () => {
        const sysMsg: ChatCompletionRequestMessage = { role: "system", content: 'hello' }
        const messages = [sysMsg]
        responseType = 'code'
        const result = await promptAi({aiResponse, question, messages})
        console.log({result})
        if (result !== Control.ABORT) {
            const resp = getLastResponseMessageByAssistant(result)
            console.log('resp', resp)
            expect(resp).toContain(responseMap.code)
        } else {
            throw 'WRONG'
        }
    })    
})