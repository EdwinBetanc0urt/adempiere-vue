import {
  runProcess,
  requestProcessActivity
} from '@/api/ADempiere/data'

const processControl = {
  state: {
    visibleDialog: false,
    reportObject: {},
    reportList: [],
    serveList: [],
    metadata: {},
    process: [],
    sessionProcess: []
  },
  mutations: {
    addStartedProcess(state, payload) {
      state.process.push(payload)
    },
    addServerProcess(state, payload) {
      state.serveList.push(payload)
    },
    dataResetCacheProcess(state, payload) {
      state.process = payload
    },
    setShowDialog(state, payload) {
      state.visibleDialog = true
      state.metadata = payload
    },
    setCloseDialog(state, payload) {
      state.visibleDialog = false
      state.metadata = payload
    },
    setReportValues(state, payload) {
      state.reportObject = payload
      state.reportList.push(payload)
    },
    setSessionProcess(state, payload) {
      state.sessionProcess = payload.responses
    },
    changeFormatReport(state, payload) {
      state.reportFormat = payload
    }
  },
  actions: {
    // Supported Actions for it
    startProcess({ commit, rootGetters, dispatch }, payload) {
      var reportExportType
      if (typeof payload.action.reportExportType === 'undefined') {
        reportExportType = payload.reportFormat
      } else {
        reportExportType = payload.action.reportExportType
      }
      var processResult = {}
      var finalParameters = rootGetters.getParamsProcessToServer(payload.containerUuid)
      if (finalParameters.length < 1) {
        console.info('Parameters empty')
        return
      }
      var processToRun = {
        uuid: payload.action.uuid,
        name: payload.action.name,
        description: payload.action.description,
        help: payload.action.help,
        isReport: payload.action.isReport,
        accessLevel: payload.accessLevel,
        showHelp: payload.action.showHelp,
        isDirectPrint: payload.action.isDirectPrint,
        reportExportType: reportExportType,
        parameters: finalParameters
      }
      requestProcessActivity({ commit }, process)
        .then(response => {
          console.log(response)
          var server = response.getResponsesList()
          console.log(server)
          commit('addStartedProcess', server)
        })
      if (!processToRun.isReport) {
        commit('addStartedProcess', processToRun)
      }

      // Run process on server and wait for it for notify
      runProcess(processToRun)
        .then(response => {
          var output = response.getOutput()
          if (typeof output !== 'undefined') {
            output = {
              uuid: output.getUuid(),
              name: output.getName(),
              description: output.getDescription(),
              fileName: output.getFilename().replace(/ /g, ''),
              outputStream: output.getOutputstream(),
              reportExportType: output.getReportexporttype()
            }
          }
          processResult = {
            action: processToRun.name,
            instanceUuid: response.getInstanceuuid().trim(),
            processUuid: processToRun.uuid.trim(),
            isError: response.getIserror(),
            isReport: processToRun.isReport,
            summary: response.getSummary(),
            resultTableId: response.getResulttableid(),
            logs: response.getLogsList(),
            output: output
          }
          dispatch('finishProcess', processResult)
        })
        .catch(error => {
          processResult = {
            instanceUuid: '',
            processUuid: processToRun.uuid.trim(),
            isError: true,
            summary: '',
            resultTableId: '',
            logs: [],
            output: {
              uuid: '',
              name: '',
              description: '',
              fileName: '',
              output: '',
              outputStream: '',
              reportExportType: ''
            }
          }
          dispatch('finishProcess', processResult)
          console.log('Error running the process', error)
        })
    },
    getSessionProcessFromServer({ commit }) {
      // Example of process Activity
      requestProcessActivity()
        .then(response => {
          /* var infoLogs = response.getLogsList().map((log) => {
            return {
              recordId: log.getRecordid(),
              log: log.getLog()
            }
          }) */
          var responseList = response.getResponsesList().map((responseItem) => {
            return {
              instanceUuid: responseItem.getInstanceuuid(),
              isError: responseItem.getIserror(),
              summary: responseItem.getSummary(),
              resultTableId: responseItem.getResulttableid(),
              isProcessing: responseItem.getIsprocessing(),
              logs: responseItem.getLogsList(),
              output: responseItem.getOutput()
            }
          })
          responseList.forEach((item) => {
            if (typeof item.output !== 'undefined') {
              item.output = {
                uuid: item.output.getUuid(),
                name: item.output.getName(),
                description: item.output.getDescription(),
                fileName: item.output.getFilename(),
                output: item.output.getOutput(),
                outputStream: item.output.getOutputstream(),
                reportExportType: item.output.getReportexporttype()
              }
            }
          })
          var processResponseList = {
            recordCount: response.getRecordcount(),
            responses: responseList
          }
          commit('setSessionProcess', processResponseList)
        })
        .catch(error => {
          console.log(error)
        })
    },
    setShowDialog({ commit }, process) {
      if (typeof process === 'undefined') {
        commit('setCloseDialog')
      } else {
        commit('setShowDialog', process)
      }
    },
    finishProcess({ commit }, processOutput) {
      if (!processOutput.isError &&
        typeof processOutput.instanceUuid !== 'undefined' &&
        typeof processOutput.processUuid !== 'undefined' &&
        typeof processOutput.output.fileName !== 'undefined') {
        commit('setReportValues', processOutput)
        commit('addStartedProcess', processOutput)
      } else {
        commit('setReportValues', processOutput)
      }
    },
    changeFormatReport({ commit }, reportFormat) {
      if (typeof reportFormat !== 'undefined') {
        commit('changeFormatReport', reportFormat)
      }
    }
  },
  getters: {
    getServerProcess: (state) => {
      return state.serveList
    },
    getActionProcess: (state) => (processUuid) => {
      var process = state.process.find(
        item => item.uuid === processUuid
      )
      return process
    },
    getRunningProcess: (state, rootGetters) => {
      var process
      var processList = state.process.map((item) => {
        if (!item.isReport) {
          process = rootGetters.getProcess(item.uuid)
          return {
            ...process,
            action: 'Run Process'
          }
        } else {
          process = rootGetters.getProcess(item.processUuid)
          if (typeof process !== 'undefined') {
            return {
              ...process,
              action: item.action,
              instanceUuid: item.instanceUuid,
              output: item.output,
              logs: item.logs,
              summary: item.summary
            }
          }
        }
      })
      return processList
    },
    getProcessResult: (state) => {
      return state.reportObject
    },
    getCachedReport: (state) => (instanceUuid) => {
      var cachedReport = state.reportList.find(
        item => item.instanceUuid === instanceUuid
      )
      return cachedReport
    },
    getReportInfo: (state) => (procesUuid) => {
      var reportInfo = state.reportList.find(
        item => item.processUuid === procesUuid
      )
      return reportInfo
    },
    getSessionProcess: (state) => (instanceUuid) => {
      var sessionProcess = state.sessionProcess.find(
        item => item.instanceUuid === instanceUuid
      )
      return sessionProcess
    }
  }
}

export default processControl
