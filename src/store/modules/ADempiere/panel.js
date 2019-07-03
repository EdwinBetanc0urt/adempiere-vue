// Vuex file for store all related to panel and fields
// Use it for handle events for changes and put context, also can be
// used for hadle isDisplayed logic, read only logic and mandatory logic
// The scope is use panel as storage of:
// - Window: Just need storage tab and fields
// - Process & Report: Always save a panel and parameters
// - Smart Browser: Can have a search panel, table panel and process panel
import evaluator from '@/utils/ADempiere/evaluator.js'
import { isEmptyValue } from '@/utils/ADempiere/valueUtil.js'
import { assignedGroup } from '@/utils/ADempiere'

const panel = {
  state: {
    panel: []
  },
  mutations: {
    addPanel(state, payload) {
      state.panel.push(payload)
    },
    addFields(state, payload) {
      state.panel.find(
        item => item.uuid === payload.containerUuid
      ).fieldList = payload.fieldList
    },
    changeFieldLogic(state, payload) {
      if (typeof payload.isDisplayedFromLogic !== 'undefined') {
        payload.field.isDisplayedFromLogic = payload.isDisplayedFromLogic
      }
      if (typeof payload.isMandatoryFromLogic !== 'undefined') {
        payload.field.isMandatoryFromLogic = payload.isMandatoryFromLogic
      }
      if (typeof payload.isReportFromLogic !== 'undefined') {
        payload.field.isReportFromLogic = payload.isReportFromLogic
      }
    },
    dictionaryResetCache(state, payload) {
      state.panel = payload
    },
    changeFieldShowedFromUser(state, payload) {
      state = state.panel.map(item => {
        if (payload.containerUuid === item.containerUuid) {
          return payload.newPanel
        }
        return item
      })
    },
    changeColumnShowedFromUser(state, payload) {
      state = state.panel.map(item => {
        if (payload.containerUuid === item.containerUuid) {
          return payload.newPanel
        }
        return item
      })
    },
    changeFieldValue(state, payload) {
      payload.field.oldValue = payload.field.value
      payload.field.value = payload.newValue
      payload.field.valueTo = payload.valueTo
    }
  },
  actions: {
    addPanel({ commit, dispatch }, params) {
      var keyColumn = ''
      var selectionColumn = []

      params.fieldList.forEach((itemField) => {
        if (itemField.isKey) {
          keyColumn = itemField.columnName
        }
        if (itemField.isSelectionColumn) {
          selectionColumn.push(itemField.columnName)
        }

        dispatch('setContext', {
          parentUuid: params.parentUuid,
          containerUuid: params.uuid,
          columnName: itemField.columnName,
          value: itemField.value
        })
      })

      params.keyColumn = keyColumn
      params.selectionColumn = selectionColumn

      params.fieldList = assignedGroup(params.fieldList)
      commit('addPanel', params)
    },
    addFields({ commit }, params) {
      commit('addFields', params)
    },
    changeFieldShowedFromUser({ commit, dispatch, getters }, params) {
      var panel = getters.getPanel(params.containerUuid)
      var showsFieldsWithValue = false
      var hiddenFieldsWithValue = false
      var newFields = panel.fieldList.map((itemField) => {
        if (params.fieldsUser.length > 0 && params.fieldsUser.indexOf(itemField.columnName) !== -1) {
          // if it isShowedFromUser it is false, and it has some value, it means
          // that it is going to show, therefore the SmartBrowser must be searched
          if (!isEmptyValue(itemField.value) && !itemField.isShowedFromUser) {
            showsFieldsWithValue = true
          }
          itemField.isShowedFromUser = true
          return itemField
        }
        // if it isShowedFromUser it is true, and it has some value, it means
        // that it is going to hidden, therefore the SmartBrowser must be searched
        if (!isEmptyValue(itemField.value) && itemField.isShowedFromUser) {
          hiddenFieldsWithValue = true
        }
        itemField.isShowedFromUser = false
        return itemField
      })
      panel.fieldList = newFields
      commit('changeFieldShowedFromUser', {
        containerUuid: params.containerUuid,
        newPanel: panel
      })
      // Updated record result
      if (panel.panelType === 'browser' && (showsFieldsWithValue || hiddenFieldsWithValue)) {
        dispatch('getBrowserSearch', {
          containerUuid: panel.uuid,
          clearSelection: true
        })
      }
    },
    changeColumnShowedFromUser({ commit, getters }, params) {
      var panel = getters.getPanel(params.containerUuid)
      var newFields = panel.fieldList.map((itemField) => {
        if (params.fieldsUser.length > 0 && params.fieldsUser.indexOf(itemField.columnName) !== -1) {
          itemField.isShowedTableFromUser = true
          return itemField
        }
        itemField.isShowedTableFromUser = false
        return itemField
      })
      panel.fieldList = newFields
      commit('changeColumnShowedFromUser', {
        containerUuid: params.containerUuid,
        newPanel: panel
      })
    },
    notifyPanelChange({ state, dispatch }, params) {
      state.panel
        .find(item => item.uuid === params.containerUuid).fieldList
        .filter(field => field.dependentFieldsList !== undefined)
        .forEach((actionField) => {
          dispatch('notifyFieldChange', {
            parentUuid: params.parentUuid,
            containerUuid: params.containerUuid,
            columnName: actionField.columnName,
            newValue: actionField.value
          })
        })
    },
    notifyFieldChange({ commit, state, dispatch, getters }, params) {
      //  Call context management
      commit('setContext', {
        ...params,
        value: params.newValue
      })
      var panel = state.panel.find(panelItem => panelItem.uuid === params.containerUuid)
      var fieldList = panel.fieldList
      var field = fieldList.find(fieldItem => fieldItem.columnName === params.columnName)
      commit('changeFieldValue', {
        field: field,
        newValue: params.newValue,
        valueTo: params.valueTo
      })
      //  Change Dependents
      var dependents = fieldList.filter(fieldItem => {
        return field.dependentFieldsList.includes(fieldItem.columnName)
      })
      //  Iterate for change logic
      dependents.forEach((dependent) => {
        //  isDisplayed Logic
        var isDisplayedFromLogic = false
        var isMandatoryFromLogic = false
        var isReadOnlyFromLogic = false
        if (dependent.displayLogic.trim() !== '') {
          isDisplayedFromLogic = evaluator.evaluateLogic({
            context: getters,
            parentUuid: params.parentUuid,
            containerUuid: params.containerUuid,
            logic: dependent.displayLogic,
            type: 'displayed'
          })
        } else {
          isDisplayedFromLogic = undefined
        }
        //  Mandatory Logic
        if (dependent.mandatoryLogic.trim() !== '') {
          isMandatoryFromLogic = evaluator.evaluateLogic({
            context: getters,
            parentUuid: params.parentUuid,
            containerUuid: params.containerUuid,
            logic: dependent.mandatoryLogic
          })
        } else {
          isReadOnlyFromLogic = undefined
        }
        //  Read Only Logic
        if (dependent.readOnlyLogic.trim() !== '') {
          isReadOnlyFromLogic = evaluator.evaluateLogic({
            context: getters,
            parentUuid: params.parentUuid,
            containerUuid: params.containerUuid,
            logic: dependent.readOnlyLogic
          })
        } else {
          isReadOnlyFromLogic = undefined
        }
        commit('changeFieldLogic', {
          field: dependent,
          isDisplayedFromLogic: isDisplayedFromLogic,
          isMandatoryFromLogic: isMandatoryFromLogic,
          isReadOnlyFromLogic: isReadOnlyFromLogic
        })
      })
      var isMandatory = field.isMandatory && field.isMandatoryFromLogic
      var isDisplayed = field.isDisplayed && field.isDisplayedFromLogic && (isMandatory || field.isShowedFromUser)
      if (panel.panelType === 'browser' && isDisplayed) {
        dispatch('getBrowserSearch', {
          containerUuid: params.containerUuid,
          clearSelection: true
        })
      }
    },
    getPanelAndFields({ dispatch }, params) {
      if (params.type === 'process' || params.type === 'report') {
        return dispatch('getProcessFromServer', params.containerUuid)
          .then(response => {
            if (response) {
              return response
            }
          })
      } else if (params.type === 'browser') {
        return dispatch('getBrowserFromServer', params.containerUuid)
          .then(response => {
            if (response) {
              return response
            }
          })
      } else if (params.type === 'window') {
        return dispatch('getTabAndFieldFromServer', {
          parentUuid: params.parentUuid,
          containerUuid: params.containerUuid
        }).then(response => {
          if (response) {
            return response
          }
        })
      }
    },
    dictionaryResetCache({ commit }, param = []) {
      commit('dictionaryResetCache', param)
      commit('dictionaryResetCacheWindow', param)
      commit('dictionaryResetCacheProcess', param)
      commit('dictionaryResetCacheBrowser', param)
    }
  },
  getters: {
    getPanel: (state) => (containerUuid) => {
      return state.panel.find(item => item.uuid === containerUuid)
    },
    getFieldsListFromPanel: (state, getters) => (containerUuid) => {
      var panel = getters.getPanel(containerUuid)
      if (typeof panel === 'undefined') {
        return []
      }
      return panel.fieldList
    },
    getFieldFromColumnName: (state, getters) => (columnName, containerUuid) => {
      var fieldList = getters.getFieldsListFromPanel(containerUuid)
      return fieldList.find(field => field.columnName === columnName)
    },
    getFieldFromUuid: (state, getters) => (uuid, containerUuid) => {
      var fieldList = getters.getFieldsListFromPanel(containerUuid)
      return fieldList.find(field => field.uuid === uuid)
    },
    getChangedFieldsList: (state) => (containerUuid) => {
      var panel = state.panel.find(
        itemPanel => itemPanel.uuid === containerUuid
      )

      if (typeof panel === 'undefined') {
        return panel
      }
      var fieldList = panel.fieldList.filter((itemField) => {
        return !isEmptyValue(itemField.value)
      })

      // fields with not empty value
      return fieldList
    },
    /**
     * get field list visible and with values
     */
    getPanelParameters: (state, getters) => (containerUuid, isEvaluateEmptyDisplayed = false) => {
      const fieldList = getters.getFieldsListFromPanel(containerUuid)
      const fields = fieldList.length
      var params = []
      var fieldsMandatory = []
      var isEmptyFieldDisplayed = false // indicate if exists a field displayed and empty value

      if (fields > 0) {
        params = fieldList.filter(fieldItem => {
          const isMandatory = fieldItem.isMandatory && fieldItem.isMandatoryFromLogic
          const isDisplayed = fieldItem.isActive && fieldItem.isDisplayed && fieldItem.isDisplayedFromLogic && (fieldItem.isShowedFromUser || isMandatory)
          // mandatory fields
          if (isMandatory) {
            fieldsMandatory.push(fieldItem)
          }
          if (!isEmptyValue(fieldItem.value) && isDisplayed) {
            return true
          }
          // empty value
          if (isMandatory && isEvaluateEmptyDisplayed) {
            isEmptyFieldDisplayed = true
          }
          return false
        })

        if (isEvaluateEmptyDisplayed && isEmptyFieldDisplayed) {
          return {
            fields: fields,
            params: [],
            fieldsMandatory: fieldsMandatory
          }
        }
      }
      return {
        fields: fields,
        params: params,
        fieldsMandatory: fieldsMandatory
      }
    }
  }
}

export default panel
