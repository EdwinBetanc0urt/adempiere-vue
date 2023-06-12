/**
 * ADempiere-Vue (Frontend) for ADempiere ERP & CRM Smart Business Solution
 * Copyright (C) 2017-Present E.R.P. Consultores y Asociados, C.A. www.erpya.com
 * Contributor(s): Edwin Betancourt EdwinBetanc0urt@outlook.com https://github.com/EdwinBetanc0urt
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import Vue from 'vue'

// API Request Methods// API Request Methods
import {
  requestPaymentSelectionsList,
  requestGetPaymentSelection,
  requestGetDocumentSequence,
  requestPaymentRulesList
} from '@/api/ADempiere/form/VPayPrint.js'

// Utils and Helpers Methods
import { isEmptyValue } from '@/utils/ADempiere/valueUtils.js'
import { getCurrency } from '@/utils/ADempiere/formatValue/numberFormat'
import { showMessage } from '@/utils/ADempiere/notification'

const initState = {
  countries: {},
  isShowedLocation: false,
  paymentsSelectionsList: {},
  paymentSelectionDetail: {},
  // container uuid: record uuid
  emptyPaymentSelection: {
    searchValue: '',
    recordsList: [],
    nextPageToken: undefined,
    recordCount: 0,
    isLoaded: false,
    pageNumber: 1,
    currentValueId: -1
  },
  paymentRulesList: {},
  emptyPaymentRule: {
    paymentSelectionId: -1,
    searchValue: '',
    recordsList: [],
    nextPageToken: undefined,
    recordCount: 0,
    isLoaded: false,
    pageNumber: 1,
    currentValueId: -1
  }
}

const VPayPrint = {
  state: initState,

  mutations: {
    setPaymentSelectionsList(state, {
      currentValueId = -1,
      recordsList,
      nextPageToken,
      recordCount,
      searchValue,
      pageSize,
      isLoaded = false
    }) {
      Vue.set(state, 'paymentsSelectionsList', {
        recordsList,
        nextPageToken,
        recordCount,
        searchValue,
        pageSize,
        isLoaded,
        currentValueId
      })
    },
    setCurrentPaymentSelectionId(state, value) {
      Vue.set(state.paymentsSelectionsList, 'currentValueId', value)
    },

    setPaymentSelectionDetail(state, values) {
      state.paymentSelectionDetail = values
    },

    setPaymentRulesList(state, {
      paymentSelectionId,
      currentValueId = -1,
      recordsList,
      nextPageToken,
      recordCount,
      searchValue,
      pageSize,
      isLoaded = false
    }) {
      Vue.set(state, 'paymentRulesList', {
        paymentSelectionId,
        recordsList,
        nextPageToken,
        recordCount,
        searchValue,
        pageSize,
        isLoaded,
        currentValueId
      })
    },

    setCurrentPaymentRuleId(state, value) {
      Vue.set(state.paymentRulesList, 'currentValueId', value)
    }
  },

  actions: {
    getPaymentsSelectionsListFromServer({ commit, getters }, {
      searchValue,
      pageSize,
      pageToken
    }) {
      return new Promise(resolve => {
        requestPaymentSelectionsList({
          searchValue,
          pageSize,
          pageToken
        })
          .then(response => {
            const recordsList = response.recordsList.map(row => {
              return {
                displayedValue: row.values.DisplayColumn,
                id: row.id,
                uuid: row.uuid
              }
            })

            const currentValueId = getters.getCurrentPaymentSelectionId

            commit('setPaymentSelectionsList', {
              currentValueId,
              recordsList,
              nextPageToken: response.nextPageToken,
              recordCount: response.recordCount,
              searchValue,
              pageSize,
              isLoaded: true
            })

            resolve(recordsList)
          })
          .catch(error => {
            console.warn(error)
            showMessage({
              message: error,
              type: 'error'
            })
          })
      })
    },

    getDocumentSequenceFromServer({ commit, getters }, {
      paymentSelectionId,
      paymentSelectionUuid
    }) {
      return new Promise(resolve => {
        requestGetDocumentSequence({
          paymentSelectionId
        })
          .then(response => {
            console.log(response)

            resolve(response)
          })
      })
    },

    getPaymentsSelectionFromServer({ commit, getters }, {
      id,
      uuid
    }) {
      return new Promise(resolve => {
        requestGetPaymentSelection({
          id,
          uuid
        })
          .then(response => {
            commit('setPaymentSelectionDetail', {
              ...response
            })
            resolve(response)
          })
          .catch(error => {
            console.warn(error)
            showMessage({
              message: error,
              type: 'error'
            })
          })
      })
    },

    getPaymentRulesListFromServer({ commit, getters }, {
      paymentSelectionId = -1,
      searchValue,
      pageSize,
      pageToken
    }) {
      return new Promise(resolve => {
        requestPaymentRulesList({
          paymentSelectionId,
          searchValue,
          pageSize,
          pageToken
        })
          .then(response => {
            const recordsList = response.recordsList.map(row => {
              return {
                displayedValue: row.values.DisplayColumn,
                value: row.values.ValueColumn,
                id: row.id,
                uuid: row.uuid
              }
            })

            const currentValueId = getters.getCurrentPaymentRuleId

            commit('setPaymentRulesList', {
              currentValueId,
              paymentSelectionId,
              recordsList,
              nextPageToken: response.nextPageToken,
              recordCount: response.recordCount,
              searchValue,
              pageSize,
              isLoaded: true
            })

            resolve(recordsList)
          })
          .catch(error => {
            console.warn(error)
            showMessage({
              message: error,
              type: 'error'
            })
          })
      })
    }
  },

  getters: {
    getCurrentPaymentSelectionId: (state) => {
      if (!isEmptyValue(state.paymentsSelectionsList)) {
        return state.paymentsSelectionsList.currentValueId
      }
      return -1
    },
    getPaymentsSelectionsList: (state) => {
      if (!isEmptyValue(state.paymentsSelectionsList)) {
        return state.paymentsSelectionsList.recordsList
      }
      return []
    },
    getPaymentSelectionDetail: (state) => {
      if (!isEmptyValue(state.paymentSelectionDetail)) {
        return state.paymentSelectionDetail
      }
      return {
        bank_account: {
          bank_name: '',
          current_balance: 0,
          account_no: ''
        },
        currency: {
          iso_code: getCurrency()
        }
      }
    },
    getCurrentPaymentRuleId: (state) => {
      if (!isEmptyValue(state.paymentRulesList)) {
        return state.paymentRulesList.currentValueId
      }
      return -1
    },
    getPaymentRulesList: (state, getters) => {
      if (!isEmptyValue(state.paymentRulesList)) {
        if (state.paymentRulesList.paymentSelectionId === getters.getCurrentPaymentSelectionId) {
          return state.paymentRulesList.recordsList
        }
      }
      return []
    }
  }
}

export default VPayPrint
