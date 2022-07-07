/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'
import { IResource, IResourceDefinition } from './resource'

export const AgentMachineApiVersion = 'capi-provider.agent-install.openshift.io/v1alpha1'
export type AgentMachineApiVersionType = 'capi-provider.agent-install.openshift.io/v1alpha1'

export const AgentMachineKind = 'AgentMachine'
export type AgentMachineKindType = 'AgentMachine'

export const AgentMachineDefinition: IResourceDefinition = {
    apiVersion: AgentMachineApiVersion,
    kind: AgentMachineKind,
}

export interface AgentMachine extends IResource {
    apiVersion: AgentMachineApiVersionType
    kind: AgentMachineKindType
    metadata: Metadata
    spec: {
        clusterName: string
    }
}
