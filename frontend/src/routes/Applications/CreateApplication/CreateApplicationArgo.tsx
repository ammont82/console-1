/* Copyright Contributors to the Open Cluster Management project */

import { useData, useItem } from '@patternfly-labs/react-form-wizard'
import { ArgoWizard } from '@patternfly-labs/react-form-wizard/lib/wizards/Argo/ArgoWizard'
import { AcmToastContext } from '../../../ui-components'
import moment from 'moment-timezone'
import { useContext } from 'react'
import { useHistory } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import {
    applicationSetsState,
    channelsState,
    gitOpsClustersState,
    managedClusterSetBindingsState,
    managedClusterSetsState,
    managedClustersState,
    namespacesState,
    placementsState,
    secretsState,
} from '../../../atoms'
import { SyncEditor } from '../../../components/SyncEditor/SyncEditor'
import { useTranslation } from '../../../lib/acm-i18next'
import { isType } from '../../../lib/is-type'
import { NavigationPath } from '../../../NavigationPath'
import {
    ApplicationSetKind,
    createResources,
    getGitChannelBranches,
    getGitChannelPaths,
    IResource,
    unpackProviderConnection,
} from '../../../resources'
import { argoAppSetQueryString } from './actions'
import schema from './schema.json'

export default function CreateArgoApplicationSetPage() {
    return <CreateApplicationArgo />
}

export function WizardSyncEditor() {
    const resources = useItem() // Wizard framework sets this context
    const { update } = useData() // Wizard framework sets this context
    return (
        <SyncEditor
            editorTitle={'Application set YAML'}
            variant="toolbar"
            resources={resources}
            schema={schema}
            onEditorChange={(changes: { resources: any[] }): void => {
                update(changes?.resources)
            }}
        />
    )
}

function getWizardSyncEditor() {
    return <WizardSyncEditor />
}

export function CreateApplicationArgo() {
    const { t } = useTranslation()
    const history = useHistory()
    const [applicationSets] = useRecoilState(applicationSetsState)
    const toast = useContext(AcmToastContext)
    const [placements] = useRecoilState(placementsState)
    const [gitOpsClusters] = useRecoilState(gitOpsClustersState)
    const [channels] = useRecoilState(channelsState)
    const [namespaces] = useRecoilState(namespacesState)
    const [secrets] = useRecoilState(secretsState)
    const [managedClusters] = useRecoilState(managedClustersState)
    const [clusterSets] = useRecoilState(managedClusterSetsState)
    const [managedClusterSetBindings] = useRecoilState(managedClusterSetBindingsState)
    const providerConnections = secrets.map(unpackProviderConnection)

    const availableArgoNS = gitOpsClusters
        .map((gitOpsCluster) => gitOpsCluster.spec?.argoServer?.argoNamespace)
        .filter(isType)
    const availableNamespace = namespaces.map((namespace) => namespace.metadata.name).filter(isType)
    const ansibleCredentials = providerConnections.filter(
        (providerConnection) =>
            providerConnection.metadata?.labels?.['cluster.open-cluster-management.io/type'] === 'ans' &&
            !providerConnection.metadata?.labels?.['cluster.open-cluster-management.io/copiedFromSecretName']
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
            createClusterSetCallback={() => open(NavigationPath.clusterSets, '_blank')}
            ansibleCredentials={availableAnsibleCredentials}
            argoServers={availableArgoNS}
            namespaces={availableNamespace}
            applicationSets={applicationSets}
            placements={placements}
            clusters={managedClusters}
            clusterSets={clusterSets}
            clusterSetBindings={managedClusterSetBindings}
            channels={channels}
            getGitRevisions={getGitChannelBranches}
            getGitPaths={getGitChannelPaths}
            yamlEditor={getWizardSyncEditor}
            onCancel={() => history.push(NavigationPath.applications)}
            onSubmit={(data) => {
                const resources = data as IResource[]
                return createResources(resources).then(() => {
                    const applicationSet = resources.find((resource) => resource.kind === ApplicationSetKind)
                    if (applicationSet) {
                        toast.addAlert({
                            title: t('Application set created'),
                            message: t('{{name}} was successfully created.', { name: applicationSet.metadata?.name }),
                            type: 'success',
                            autoClose: true,
                        })
                    }
                    history.push(
                        NavigationPath.applicationOverview
                            .replace(':namespace', applicationSet?.metadata?.namespace ?? '')
                            .replace(':name', applicationSet?.metadata?.name ?? '') + argoAppSetQueryString
                    )
                })
            }}
            timeZones={timeZones}
        />
    )
}
