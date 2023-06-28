import readline from 'readline'

export type AskQuestionFn = (prompt: string) => Promise<string>

// TODO: use prompt-sync library?
export function askQuestion(prompt: string): Promise<string> {
  console.log('readline question')
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    rl.question(prompt, (answer: string) => {
      resolve(answer)
      rl.close()
    })
  })
}
