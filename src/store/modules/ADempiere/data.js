import { getObject, getObjectListFromCriteria, getRecentItems } from '@/api/ADempiere/data'
import { convertValueFromGRPC } from '@/utils/ADempiere'

const data = {
  state: {
    recordSelection: [],
    recentItems: []
  },
  mutations: {
    recordSelection(state, payload) {
      if (payload.index > -1 && typeof payload.index !== 'undefined') {
        state.recordSelection.splice(payload.index, 1, payload)
      } else {
        state.recordSelection.push(payload)
      }
    },
    deleteRecortContainer(state, payload) {
      state.recordSelection = payload
    },
    notifyCellTableChange: (state, payload) => {
      payload.row[payload.columnName] = payload.value
      if (typeof payload.displayColumn !== 'undefined') {
        var key = 'DisplayColumn_' + payload.columnName
        payload.row[key] = payload.displayColumn
      }
    },
    notifyCellSelectionChange: (state, payload) => {
      if (typeof payload.row !== 'undefined') {
        payload.row[payload.columnName] = payload.value
        if (typeof payload.displayColumn !== 'undefined') {
          var key = 'DisplayColumn_' + payload.columnName
          payload.row[key] = payload.displayColumn
        }
      }
    },
    setRecentItems(state, payload) {
      state.recentItems = payload
    }
  },
  actions: {
    recordSelection({ commit, state }, parameters) {
      var index = state.recordSelection.findIndex((recordItem) => {
        return recordItem.containerUuid === parameters.containerUuid
      })
      commit('recordSelection', {
        ...parameters,
        index: index
      })
    },
    deleteRecortContainer({ commit, state }, containerUuid) {
      var record = state.recordSelection.filter(itemRecord => {
        return itemRecord.containerUuid !== containerUuid
      })
      commit('deleteRecortContainer', record)
    },
    getObject: ({ dispatch }, objectParams) => {
      return new Promise((resolve, reject) => {
        getObject(objectParams.table, objectParams.recordUuid)
          .then(response => {
            var map = response.getValuesMap()
            var newValue = {}

            for (const [key, value] of map.entries()) {
              var valueResult = map.get(key)
              var tempValue = null
              if (valueResult) {
                tempValue = convertValueFromGRPC(value)
              }
              newValue[key] = tempValue

              dispatch('setContext', {
                parentUuid: objectParams.parentUuid,
                containerUuid: objectParams.containerUuid,
                columnName: key,
                value: tempValue
              })
            }
            resolve(newValue)
          })
          .catch(err => {
            reject(err)
          })
      })
    },
    getObjectListFromCriteria: ({ commit, rootGetters }, objectParams) => {
      return new Promise((resolve, reject) => {
        getObjectListFromCriteria(objectParams.table, objectParams.criteria)
          .then(response => {
            const recordList = response.getRecordsList()
            var record = recordList.map(itemRecord => {
              const map = itemRecord.getValuesMap()
              var values = {}
              map.forEach((value, key) => {
                values[key] = convertValueFromGRPC(value)
              })
              return values
            })

            var selection = rootGetters.getDataRecordSelection(objectParams.containerUuid)
            commit('recordSelection', {
              containerUuid: objectParams.containerUuid,
              record: record,
              selection: selection
            })
            resolve(record)
          })
          .catch(error => {
            reject(error)
          })
      })
    },
    getRecentItemsFromServer: ({ commit }) => {
      return new Promise((resolve, reject) => {
        getRecentItems()
          .then(response => {
            var recentItemsList = response.getRecentitemsList()
            var recentItems = recentItemsList.map(item => {
              var tabUuid = item.getTabuuid()
              return {
                displayName: item.getDisplayname(),
                menuUuid: item.getMenuuuid(),
                menuName: item.getMenuname(),
                windowUuid: item.getWindowuuid(),
                tableId: item.getTableid(),
                recordId: item.getRecordid(),
                tabUuid: tabUuid
              }
            })
            commit('setRecentItems', recentItems)
            resolve(recentItems)
          })
          .catch(error => {
            reject(error)
          })
      })
    },
    notifyCellTableChange: ({ commit, state }, objectParams) => {
      var recordSelection = state.recordSelection.find(recordItem => {
        return recordItem.containerUuid === objectParams.containerUuid
      })
      var row = recordSelection.record.find(itemRecord => {
        return itemRecord[objectParams.keyColumn] === objectParams.rowKey
      })
      var rowSelection = recordSelection.selection.find(itemRecord => {
        return itemRecord[objectParams.keyColumn] === objectParams.rowKey
      })

      commit('notifyCellSelectionChange', {
        row: rowSelection,
        value: objectParams.newValue,
        columnName: objectParams.columnName,
        displayColumn: objectParams.displayColumn
      })
      commit('notifyCellTableChange', {
        row: row,
        value: objectParams.newValue,
        columnName: objectParams.columnName,
        displayColumn: objectParams.displayColumn
      })
    }
  },
  getters: {
    getDataRecordAndSelection: (state) => (containerUuid) => {
      var data = state.recordSelection.find(itemRecord => {
        return itemRecord.containerUuid === containerUuid
      })
      if (typeof data !== 'undefined') {
        return data
      }
      return {
        containerUuid: containerUuid,
        record: [],
        selection: []
      }
    },
    getDataRecordDetail: (state, getters) => (containerUuid) => {
      var data = getters.getDataRecordAndSelection(containerUuid)
      return data.record
    },
    getDataRecordSelection: (state, getters) => (containerUuid) => {
      var selection = getters.getDataRecordAndSelection(containerUuid)
      return selection.selection
    },
    /**
     * Getter converter selection params with value format
     * [
     *    { columname, value },
     *    { columname, value },
     *    { columname, value },
     *    { columname, value }
     * ]
     */
    getParamsProcessToServer: (state, getters, rootState, rootGetters) => (containerUuid) => {
      var fieldList = rootGetters.getPanelParameters(containerUuid, true)
      var parameters = []
      var fieldsMandatory = []
      if (fieldList.fields > 0) {
        var fieldListRange = []
        parameters = fieldList.params.map(fieldItem => {
          if (fieldItem.isRange) {
            fieldListRange.push({
              columnName: fieldItem.columnName + '_To',
              value: fieldItem.valueTo
            })
          }
          if (fieldItem.isMandatory || fieldItem.isMandatoryFromLogic) {
            fieldsMandatory.push(fieldItem)
          }
          return {
            columnName: fieldItem.columnName,
            value: fieldItem.value
          }
        })
        parameters = parameters.concat(fieldListRange)
      }
      return {
        params: parameters,
        fields: fieldList.fields,
        fieldsMandatory: fieldsMandatory.length
      }
    },
    /**
     * Getter converter selection data record in format
     * [
     *  {
     *    selectionId: keyColumn Value,
     *    selectionValues: [
     *      { columname, value },
     *      { columname, value },
     *      { columname, value }
     *    ]
     *  },
     *  {
     *    selectionId: keyColumn Value,
     *    selectionValues: [
     *      { columname, value },
     *      { columname, value }
     *    ]
     *  }
     * ]
     */
    getSelectionToServer: (state, getters, rootState, rootGetters) => (containerUuid) => {
      var selectionToServer = []
      var data = getters.getDataRecordAndSelection(containerUuid)
      if (data.selection.length > 0) {
        var panel = rootGetters.getPanel(containerUuid)
        var keyColumn = panel.keyColumn

        data.selection.forEach(itemRow => {
          var records = []

          Object.keys(itemRow).forEach(key => {
            records.push({
              columnName: key,
              value: itemRow[key]
            })
          })

          selectionToServer.push({
            selectionId: itemRow[keyColumn],
            selectionValues: records
          })
        })
      }
      return selectionToServer
    },
    getRecentItems: (state) => {
      return state.recentItems
    }
  }
}

export default data
