import { DBs } from '@gpt-team/db'
import { createConsumer, MessageBus } from '@gpt-team/channel'
import type { IAiAndUserRunner } from '@gpt-team/ai'
import type { IPhases, IPhase, IPhaseTask } from '@gpt-team/phases'
import * as amqp from 'amqplib'
import { ConsumeMessage } from 'amqplib'

export type TeamProps = {
  name: string
}

export type ProcessPhasesOps = {
  basePath: string
  createDbs: any
  mqUrl: string
  team: TeamProps
}

export class AIAgent {
  dbs: DBs
  msgBus: MessageBus
  connection: amqp.Connection
  channel: amqp.Channel
  phases: IPhases
  phase: IPhase
  task: IPhaseTask
  team: TeamProps
  runner: IAiAndUserRunner

  protected terminationMsgs = ['COMPLETED', 'TERMINATED']

  constructor() {}

  setRunner(runner: IAiAndUserRunner) {
    this.runner = runner
    return this
  }

  setDbs(dbs: DBs) {
    this.dbs = dbs
    return this
  }

  setMessageBus(msgBus: MessageBus) {
    this.msgBus = msgBus
    return this
  }

  get rawChannel() {
    return this.channel.getRawChannel()
  }

  async init() {
    this.connection = await this.msgBus.connect()
    this.channel = await this.msgBus.getChannel()
  }

  async start(phases: IPhases) {
    this.phases = phases
    console.log('Agent is waiting for messages...')
  }

  async nextPhase() {
    this.phase = await this.phases.nextPhase()
    return this.phase
  }

  async nextTask() {
    this.task = await this.phases.nextTask()
    return this.task
  }

  async getConfig() {
    return await this.task.getConfig()
  }

  async getSubscriptions() {
    const config = await this.getConfig()
    const { subscribe } = config.channels || {}
    return subscribe
  }

  async runPhases() {
    try {
      await this.init()
      while (!this.phases.isDone()) {
        await this.runPhase()
      }
      await this.close()
    } catch (error) {
      console.error('Error occurred:', error)
    }
  }

  async verifyQueue(queueName: string) {
    await this.rawChannel.assertQueue(queueName)
  }

  async runPhase() {
    try {
      await this.nextTask()
      if (this.phase.isDone()) {
        await this.nextPhase()
      }
      const QueueNamesToSubscribeTo = await this.getSubscriptions()
      const { channel, task } = this
      // from config.yaml in task folder
      for (var queueName of QueueNamesToSubscribeTo) {
        const consume = this.createConsumer({ channel, task })
        await this.verifyQueue(queueName)
        // create subscription
        this.channel.consume(queueName, consume)
      }
    } catch (error) {
      console.error('Error occurred:', error)
    }
  }

  createConsumer({ channel, task }: any) {
    return createConsumer({ channel, task })
  }

  protected isTeamDone({ body }: any) {
    return this.terminationMsgs.includes(body.message) && body.sender == this.team.name
  }

  async stopWhenDone() {
    this.channel.consume('status', async (cmsg: ConsumeMessage) => {
      const body = await this.channel.parseMsg(cmsg)

      if (this.isTeamDone({ body })) {
        this.phases.setDone()
      }
    })
  }

  async close() {
    await this.rawChannel.close()
    await this.connection.close()
  }
}
