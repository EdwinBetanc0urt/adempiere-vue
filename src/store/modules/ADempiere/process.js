import { getProcess as getProcessFromDictionary } from '@/api/ADempiere/dictionary'
import { convertFieldFromGRPC, evalutateTypeField } from '@/utils/ADempiere'

const process = {
  state: {
    process: [],
    processesList: []
  },
  mutations: {
    addProcess(state, payload) {
      state.process.push(payload)
    },
    dictionaryResetCacheProcess(state, payload) {
      state.process = payload
      state.processesList = payload
    }
  },
  actions: {
    getProcessFromServer: ({ commit, dispatch }, processUuid) => {
      return new Promise((resolve, reject) => {
        getProcessFromDictionary(processUuid)
          .then(response => {
            var panelType = 'process'
            if (response.getIsreport()) {
              panelType = 'report'
            }
            var parameterList = response.getParametersList()
            var additionalAttributes = {
              processUuid: response.getUuid(),
              processId: response.getId(),
              parentUuid: response.getUuid(),
              containerUuid: response.getUuid(),
              panelType: panelType
            }

            //  Convert from gRPC
            var fieldsRangeList = []
            var fieldDefinitionList = parameterList.map((fieldItem) => {
              if (fieldItem.getIsrange() && evalutateTypeField(fieldItem.getDisplaytype()) === 'NumberBase') {
                fieldsRangeList.push(convertFieldFromGRPC(fieldItem, additionalAttributes, true))
              }
              return convertFieldFromGRPC(fieldItem, additionalAttributes)
            })
            fieldDefinitionList = fieldDefinitionList.concat(fieldsRangeList)

            //  Get export list
            var reportExportTypeList = response.getReportexporttypesList().map((reportType) => {
              return {
                name: reportType.getName(),
                description: reportType.getDescription(),
                reportExportType: reportType.getType()
              }
            })
            //  Default Action
            var processActions = []
            var isDisableRunProcess = false
            if (response.getIsreport()) {
              isDisableRunProcess = true
            }
            processActions.push({
              name: 'Run Process',
              type: 'action',
              action: 'startProcess',
              uuid: response.getUuid(),
              description: response.getDescription(),
              help: response.getHelp(),
              isReport: response.getIsreport(),
              accessLevel: response.getAccesslevel(),
              showHelp: response.getShowhelp(),
              disabled: isDisableRunProcess,
              isDirectPrint: response.getIsdirectprint()
            }, {
              name: 'Change parameters',
              type: 'process',
              action: 'changeParameters',
              uuid: response.getUuid(),
              description: response.description,
              help: response.getHelp(),
              isReport: response.getIsreport(),
              accessLevel: response.getAccesslevel(),
              showHelp: response.getShowhelp(),
              isDirectPrint: response.getIsdirectprint()
            })

            var summaryAction = {
              name: 'Run Process As',
              type: 'summary',
              action: '',
              childs: [],
              uuid: response.getUuid(),
              description: response.getDescription(),
              help: response.getHelp(),
              isReport: response.getIsreport(),
              accessLevel: response.getAccesslevel(),
              showHelp: response.getShowhelp(),
              isDirectPrint: response.getIsdirectprint()
            }
            reportExportTypeList.forEach((actionValue) => {
              var action = {
                name: 'Export to (' + actionValue.name + ')',
                type: 'action',
                action: 'startProcess',
                uuid: response.getUuid(),
                description: actionValue.description,
                help: response.getHelp(),
                isReport: response.getIsreport(),
                accessLevel: response.getAccesslevel(),
                showHelp: response.getShowhelp(),
                isDirectPrint: response.getIsdirectprint(),
                reportExportType: actionValue.reportExportType
              }
              //  Push values
              summaryAction.childs.push(action)
            })
            //  Add summary Actions
            processActions.push(summaryAction)
            var panel = {
              id: response.getId(),
              uuid: response.getUuid(),
              name: response.getName(),
              parentUuid: response.getUuid(),
              fieldList: fieldDefinitionList,
              panelType: panelType
            }

            var processDefinition = {
              id: response.getId(),
              uuid: response.getUuid(),
              value: response.getValue(),
              name: response.getName(),
              description: response.getDescription(),
              help: response.getHelp(),
              isReport: response.getIsreport(),
              accessLevel: response.getAccesslevel(),
              showHelp: response.getShowhelp(),
              isDirectPrint: response.getIsdirectprint(),
              reportExportTypeList: reportExportTypeList,
              fieldList: fieldDefinitionList
            }
            //  Add process menu
            var contextMenu = {
              containerUuid: response.getUuid(),
              relations: [],
              actions: processActions,
              references: []
            }
            dispatch('addPanel', panel)
            commit('addProcess', processDefinition)
            commit('setMenu', contextMenu)
            resolve(processDefinition)
          })
          .catch(err => {
            console.warn('Dictionary Process (State ) - Error ' + err)
          })
      })
    }
  },
  getters: {
    getProcess: (state) => (processUuid) => {
      var process = state.process.find(
        item => item.uuid === processUuid
      )
      return process
    },
    getParametersList: (state) => (processUuid) => {
      var process = state.process.find(
        item => item.uuid === processUuid
      )
      if (typeof process === 'undefined') {
        return process
      }
      return process.parameterList
    },
    getProcessListTab: (state) => {
      return state.processesList
    }
  }
}

export default process