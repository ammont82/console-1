/* Copyright Contributors to the Open Cluster Management project */

import { ArgoWizard } from '@patternfly-labs/react-form-wizard/lib/wizards/Argo/ArgoWizard'
import moment from 'moment-timezone'
import { useHistory } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import {
    channelsState,
    gitOpsClustersState,
    managedClusterSetBindingsState,
    managedClustersState,
    namespacesState,
    placementsState,
    secretsState,
} from '../../../atoms'
import { isType } from '../../../lib/is-type'
import { NavigationPath } from '../../../NavigationPath'
import {
    createResources,
    getGitChannelBranches,
    getGitChannelPaths,
    IResource,
    unpackProviderConnection,
} from '../../../resources'

export default function CreateArgoApplicationSetPage() {
    return <CreateApplicationArgo />
}

export function CreateApplicationArgo() {
    const history = useHistory()
    const [placements] = useRecoilState(placementsState)
    const [gitOpsClusters] = useRecoilState(gitOpsClustersState)
    const [channels] = useRecoilState(channelsState)
    const [namespaces] = useRecoilState(namespacesState)
    const [secrets] = useRecoilState(secretsState)
    const [managedClusters] = useRecoilState(managedClustersState)
    const [managedClusterSetBindings] = useRecoilState(managedClusterSetBindingsState)
    const providerConnections = secrets.map(unpackProviderConnection)

    const availableArgoNS = gitOpsClusters
        .map((gitOpsCluster) => gitOpsCluster.spec?.argoServer?.argoNamespace)
        .filter(isType)
    const availableNamespace = namespaces.map((namespace) => namespace.metadata.name).filter(isType)
    const ansibleCredentials = providerConnections.filter(
        (providerConnection) =>
            providerConnection.metadata?.labels?.['cluster.open-cluster-management.io/type'] === 'ans'
    )
    const availableAnsibleCredentials = ansibleCredentials
        .map((ansibleCredential) => ansibleCredential.metadata.name)
        .filter(isType)

    const currentTimeZone = moment.tz.guess(true)
    const timeZones = currentTimeZone
        ? [currentTimeZone, ...moment.tz.names().filter((e) => e !== currentTimeZone)]
        : moment.tz.names()

    return (
        <ArgoWizard
            addClusterSets={NavigationPath.clusterSets}
            ansibleCredentials={availableAnsibleCredentials}
            argoServers={availableArgoNS}
            namespaces={availableNamespace}
            placements={placements}
            clusters={managedClusters}
            clusterSetBindings={managedClusterSetBindings}
            onCancel={() => history.push('.')}
            channels={channels}
            getGitRevisions={getGitChannelBranches}
            getGitPaths={getGitChannelPaths}
            onSubmit={(resources) =>
                createResources(resources as IResource[]).then((error) => {
                    history.push(NavigationPath.applications)
                    return error
                })
            }
            timeZones={timeZones}
        />
    )
}
