/* Copyright Contributors to the Open Cluster Management project */
import { useData, useItem } from '@patternfly-labs/react-form-wizard'
import { PolicyAutomationWizard } from '@patternfly-labs/react-form-wizard/lib/wizards/PolicyAutomation/PolicyAutomationWizard'
import { AcmToastContext } from '../../../ui-components'
import { useContext, useMemo } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { configMapsState, secretsState, subscriptionOperatorsState, usePolicies } from '../../../atoms'
import { SyncEditor } from '../../../components/SyncEditor/SyncEditor'
import { useTranslation } from '../../../lib/acm-i18next'
import { NavigationPath } from '../../../NavigationPath'
import {
    listAnsibleTowerJobs,
    PolicyAutomationApiVersion,
    PolicyAutomationKind,
    Secret,
    SubscriptionOperator,
} from '../../../resources'
import { handlePolicyAutomationSubmit } from '../common/util'
import schema from './schemaAutomation.json'

export function WizardSyncEditor() {
    const resources = useItem() // Wizard framework sets this context
    const { update } = useData() // Wizard framework sets this context
    return (
        <SyncEditor
            editorTitle={'Automation YAML'}
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

export function CreatePolicyAutomation() {
    const { t } = useTranslation()
    const params = useParams<{ namespace: string; name: string }>()
    const { name, namespace } = params
    const history = useHistory()
    const policies = usePolicies()
    const [secrets] = useRecoilState(secretsState)
    const [configMaps] = useRecoilState(configMapsState)
    const [subscriptionOperators] = useRecoilState(subscriptionOperatorsState)
    const toast = useContext(AcmToastContext)
    const currentPolicy = useMemo(
        () => policies.find((policy) => policy.metadata.name === name && policy.metadata.namespace === namespace),
        [policies, name, namespace]
    )

    const isOperatorInstalled = useMemo(() => {
        const ansibleOp = subscriptionOperators.filter((op: SubscriptionOperator) => {
            const conditions = op.status?.conditions[0]
            return (
                op.metadata.name === 'ansible-automation-platform-operator' &&
                conditions?.reason === 'AllCatalogSourcesHealthy'
            )
        })
        return ansibleOp.length > 0
    }, [subscriptionOperators])

    const credentials = useMemo(
        () =>
            secrets.filter(
                (secret: Secret) =>
                    secret.metadata.labels?.['cluster.open-cluster-management.io/type'] === 'ans' &&
                    !secret.metadata.labels?.['cluster.open-cluster-management.io/copiedFromNamespace'] &&
                    !secret.metadata.labels?.['cluster.open-cluster-management.io/copiedFromSecretName']
            ),
        [secrets]
    )

    return (
        <PolicyAutomationWizard
            title={t('Create policy automation')}
            policy={currentPolicy ?? {}}
            yamlEditor={getWizardSyncEditor}
            credentials={credentials}
            createCredentialsCallback={() => window.open(NavigationPath.addCredentials)}
            isAnsibleOperatorInstalled={isOperatorInstalled}
            configMaps={configMaps}
            resource={{
                kind: PolicyAutomationKind,
                apiVersion: PolicyAutomationApiVersion,
                metadata: {
                    name: `${name ?? ''}-policy-automation`.substring(0, 253),
                    namespace: namespace ?? '',
                },
                spec: {
                    policyRef: name ?? '',
                    mode: 'once',
                    automationDef: { name: '', secret: '', type: 'AnsibleJob' },
                },
            }}
            onCancel={() => history.push(NavigationPath.policies)}
            onSubmit={(data) => handlePolicyAutomationSubmit(data, secrets, history, toast, t)}
            getAnsibleJobsCallback={async (credential: any) => {
                const host = Buffer.from(credential.data.host || '', 'base64').toString('ascii')
                const token = Buffer.from(credential.data.token || '', 'base64').toString('ascii')

                return listAnsibleTowerJobs(host, token).promise.then((response) => {
                    let templateList: string[] = []
                    if (response?.results) {
                        templateList = response.results!.map((job) => job.name!)
                    }
                    return templateList
                })
            }}
        />
    )
}
