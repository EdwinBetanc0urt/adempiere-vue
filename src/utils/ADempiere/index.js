import REFERENCES from '@/components/ADempiere/Field/references'
import evaluator from '@/utils/ADempiere/evaluator.js'
import * as utils from './valueUtil.js'

/**
 * Converted the gRPC value to the value needed
 * @param {mixed} initialValue Value get of gRPC
 */
export function convertValueFromGRPC(initialValue) {
  if (typeof initialValue === 'undefined') {
    return null
  }
  var returnValue = ''
  switch (initialValue.getValuetype()) {
    case 0:
      returnValue = initialValue.getIntvalue()
      break

    case 1:
      returnValue = initialValue.getLongvalue()
      break

    case 2:
      returnValue = initialValue.getDoublevalue()
      break

    case 3:
      returnValue = initialValue.getBooleanvalue()
      // if (returnValue) {
      //   returnValue = 'Yes'
      // } else {
      //   returnValue = 'No'
      // }
      break

    case 4:
    case 5:
      returnValue = initialValue.getStringvalue()
      break
  }
  return returnValue
}

/**
 * Converted gRPC attributes to object
 * @param {object} fieldGRPC
 * @param {object} moreAttributes
 */
export function convertFieldFromGRPC(fieldGRPC, moreAttributes = {}, typeRange = false) {
  var group = {}
  var isShowedFromUser = false

  try {
    group = {
      name: fieldGRPC.getFieldgroup().getName(),
      fieldGroupType: fieldGRPC.getFieldgroup().getFieldgrouptype()
    }
  } catch (e) {
    group = {
      name: '',
      fieldGroupType: ''
    }
  }

  if (moreAttributes.isShowedFromUser) {
    isShowedFromUser = moreAttributes.isShowedFromUser
  }

  var reference = fieldGRPC.getReference()
  var referenceValue
  var zoomWindowList = []
  if (reference) {
    if (reference.getWindowsList()) {
      zoomWindowList = reference.getWindowsList().map((zoomWindow) => {
        return {
          id: zoomWindow.getId(),
          uuid: zoomWindow.getUuid(),
          name: zoomWindow.getName(),
          description: zoomWindow.getDescription(),
          isSOTrx: zoomWindow.getIssotrx(),
          isActive: zoomWindow.getIsactive()
        }
      })
    }
    referenceValue = {
      tableName: reference.getTablename(),
      keyColumnName: reference.getKeycolumnname(),
      displayColumnName: reference.getDisplaycolumnname(),
      query: reference.getQuery(),
      parsedQuery: reference.getQuery(),
      directQuery: reference.getDirectquery(),
      parsedDirectQuery: reference.getDirectquery(),
      validationCode: reference.getValidationcode(),
      zoomWindowList: zoomWindowList
    }
  } else {
    referenceValue = {
      tableName: '',
      keyColumnName: '',
      displayColumnName: '',
      query: '',
      parsedQuery: '',
      directQuery: '',
      parsedDirectQuery: '',
      validationCode: '',
      zoomWindowList: zoomWindowList
    }
  }

  var parsedDefaultValue = parseContext({
    ...moreAttributes,
    columnName: fieldGRPC.getColumnname(),
    value: fieldGRPC.getDefaultvalue()
  })
  var parsedDefaultValueTo = parseContext({
    ...moreAttributes,
    columnName: fieldGRPC.getColumnname(),
    value: fieldGRPC.getDefaultvalueto()
  })

  var field = {
    ...moreAttributes,

    id: fieldGRPC.getId(),
    uuid: fieldGRPC.getUuid(),
    name: fieldGRPC.getName(),
    description: fieldGRPC.getDescription(),
    help: fieldGRPC.getHelp(),
    columnName: fieldGRPC.getColumnname(),

    fieldGroup: group,
    displayType: fieldGRPC.getDisplaytype(),
    componentPath: evalutateTypeField(fieldGRPC.getDisplaytype()),
    isFieldOnly: fieldGRPC.getIsfieldonly(),
    isRange: fieldGRPC.getIsrange(),
    isSameLine: fieldGRPC.getIssameline(),
    sequence: fieldGRPC.getSequence(),
    seqNoGrid: fieldGRPC.getSeqnogrid(),
    isIdentifier: fieldGRPC.getIsidentifier(),
    isKey: fieldGRPC.getIskey(),
    isSelectionColumn: fieldGRPC.getIsselectioncolumn(),
    isUpdateable: fieldGRPC.getIsupdateable(),
    formatPattern: fieldGRPC.getFormatpattern(),
    VFormat: fieldGRPC.getVformat(),
    value: parsedDefaultValue,
    defaultValue: fieldGRPC.getDefaultvalue(),
    parsedDefaultValue: parsedDefaultValue,
    defaultValueTo: fieldGRPC.getDefaultvalueto(),
    parsedDefaultValueTo: parsedDefaultValueTo,
    valueMin: fieldGRPC.getValuemin(),
    valueMax: fieldGRPC.getValuemax(),
    //
    isDisplayed: fieldGRPC.getIsdisplayed(),
    isActive: fieldGRPC.getIsactive(),
    isMandatory: fieldGRPC.getIsmandatory(),
    isReadOnly: fieldGRPC.getIsreadonly(),
    isDisplayedFromLogic: fieldGRPC.getIsdisplayed(),
    isReadOnlyFromLogic: fieldGRPC.getIsreadonly(),
    isMandatoryFromLogic: fieldGRPC.getIsmandatory(),
    //
    callout: fieldGRPC.getCallout(),
    isQueryCriteria: fieldGRPC.getIsquerycriteria(),
    displayLogic: fieldGRPC.getDisplaylogic(),
    mandatoryLogic: fieldGRPC.getMandatorylogic(),
    readOnlyLogic: fieldGRPC.getReadonlylogic(),
    parentFieldsList: getParentFields(fieldGRPC),
    dependentFieldsList: [],
    reference: referenceValue,
    contextInfo: convertContextInfoFromGRPC(
      fieldGRPC.getContextinfo()
    ),
    // TODO: Add support on server
    // app attributes
    isShowedFromUser: isShowedFromUser
  }
  field.isShowedTableFromUser = field.isDisplayed && field.isDisplayedFromLogic

  // Overwrite some values
  if (typeRange) {
    field.uuid = field.uuid + '_To'
    field.columnName = field.columnName + '_To'
    field.name = field.name + ' To'
    field.value = parsedDefaultValueTo
    field.defaultValue = field.defaultValueTo
    field.parsedDefaultValue = field.parsedDefaultValueTo
  }
  return field
}

/**
 * Evaluate by the ID and name of the reference to call the component type
 * @param {integer} param, received from data
 * @return string type, assigned value to folder after evaluating the parameter
 */
export function evalutateTypeField(param) {
  var path = 'String'
  REFERENCES.forEach(reference => {
    if (param === reference.id || param === reference.type) {
      if (reference.support) {
        path = reference.type
        return
      }
    }
  })
  return path
}

export function getParentFields(fieldGRPC) {
  var parentFields = []
  //  For Display logic
  if (fieldGRPC.getDisplaylogic()) {
    Array.prototype.push.apply(parentFields, evaluator.parseDepends(fieldGRPC.getDisplaylogic()))
  }
  //  For Mandatory Logic
  if (fieldGRPC.getMandatorylogic()) {
    Array.prototype.push.apply(parentFields, evaluator.parseDepends(fieldGRPC.getMandatorylogic()))
  }
  //  For Read Only Logic
  if (fieldGRPC.getReadonlylogic()) {
    Array.prototype.push.apply(parentFields, evaluator.parseDepends(fieldGRPC.getReadonlylogic()))
  }
  //  For Default Value
  if (fieldGRPC.getDefaultvalue()) {
    Array.prototype.push.apply(parentFields, evaluator.parseDepends(fieldGRPC.getDefaultvalue()))
  }
  return parentFields
}

/**
 * Parse Context String
 * @param {object} context
 *  - value: (REQUIRED) String to parsing
 *  - parentUuid: (REQUIRED from Window) UUID Window
 *  - containerUuid: (REQUIRED) UUID Tab, Process, SmartBrowser, Report and Form
 *  - columnName: (Optional if exists in value) Column name to search in context
 */
export function parseContext(context) {
  const store = require('@/store')
  var value = String(context.value)
  if (utils.isEmptyValue(value)) { return '' }

  // var instances = value.length - value.replace('@', '').length
  // if ((instances > 0) && (instances % 2) !== 0) { // could be an email address
  //   return value
  // }

  var token
  var inStr = value
  var outStr = ''

  var i = inStr.indexOf('@')

  while (i !== -1) {
    outStr = outStr + inStr.substring(0, i) // up to @
    inStr = inStr.substring(i + 1, inStr.length)	// from first @
    var j = inStr.indexOf('@') // next @
    if (j < 0) {
      console.log('No second tag: ' + inStr)
      return ''	//	no second tag
    }

    token = inStr.substring(0, j)
    context.columnName = token

    var ctxInfo = store.default.getters.getContext(context)	// get context
    if ((typeof ctxInfo === 'undefined' || ctxInfo.length === 0) && (token.startsWith('#') || token.startsWith('$'))) {
      context.parentUuid = null
      context.containerUuid = null
      ctxInfo = store.default.getters.getContext(context)	// get global context
    }
    if (typeof ctxInfo === 'undefined' || ctxInfo.length === 0) {
      console.info('No Context for: ' + token)
    } else { outStr = outStr + ctxInfo } // replace context with Context

    inStr = inStr.substring(j + 1, inStr.length)	// from second @
    i = inStr.indexOf('@')
  }
  outStr = outStr + inStr	// add the rest of the string

  return outStr
}	//	parseContext

export function convertRoleFromGRPC(roleGRPC) {
  return {
    id: roleGRPC.getId(),
    uuid: roleGRPC.getUuid(),
    name: roleGRPC.getName(),
    desctiption: roleGRPC.getDescription(),
    clientId: roleGRPC.getClientid(),
    clientName: roleGRPC.getClientname(),
    organizationsList: roleGRPC.getOrganizationsList()
  }
}

export function convertContextInfoFromGRPC(contextInfoGRPC) {
  var contextInfo = {
    id: '',
    uuid: '',
    name: '',
    description: '',
    sqlStatement: '',
    isActive: '',
    messageText: convertMessageTextFromGRPC(undefined)
  }
  if (typeof contextInfoGRPC !== 'undefined') {
    contextInfo = {
      id: contextInfoGRPC.getId(),
      uuid: contextInfoGRPC.getUuid(),
      name: contextInfoGRPC.getName(),
      description: contextInfoGRPC.getDescription(),
      sqlStatement: contextInfoGRPC.getSqlstatement(),
      isActive: contextInfoGRPC.getIsactive(),
      messageText: convertMessageTextFromGRPC(
        contextInfoGRPC.getMessagetext()
      )
    }
  }
  return contextInfo
}

export function convertMessageTextFromGRPC(messageTextGRPC) {
  var messageText = {
    id: '',
    uuid: '',
    value: '',
    msgType: '',
    msgText: '',
    msgTip: '',
    isActive: ''
  }
  if (typeof messageTextGRPC !== 'undefined') {
    messageText = {
      id: messageTextGRPC.getId(),
      uuid: messageText.getUuid(),
      value: messageTextGRPC.getValue(),
      msgType: messageTextGRPC.getMsgtype(),
      msgText: messageTextGRPC.getMsgtext(),
      msgTip: messageTextGRPC.getMsgtip(),
      isActive: messageTextGRPC.getIsactive()
    }
  }
  return messageText
}

/**
 * [assignedGroup]
 * @param  {array} fieldList Field of List with
 * @return {array} fieldList
 */
export function assignedGroup(fieldList) {
  if (typeof fieldList === 'undefined' || fieldList.length <= 0) {
    return fieldList
  }

  let firstChangeGroup = false
  let currentGroup = ''
  let typeGroup = ''

  fieldList.forEach(fieldElement => {
    // change the first field group, change the band
    if (!firstChangeGroup) {
      if (typeof fieldElement.fieldGroup.name !== 'undefined' &&
        fieldElement.fieldGroup.name !== null &&
        fieldElement.fieldGroup.name !== '' &&
        currentGroup !== fieldElement.fieldGroup.name &&
        fieldElement.isDisplayed) {
        firstChangeGroup = true
      }
    }
    //  if you change the field group for the first time and it is different
    //  from 0, updates the field group, since it is another field group and
    //  assigns the following field items to the current field group whose
    //  field group is '' or null
    if (firstChangeGroup) {
      if (typeof fieldElement.fieldGroup.name !== 'undefined' &&
        fieldElement.fieldGroup.name !== null &&
        fieldElement.fieldGroup.name !== '') {
        currentGroup = fieldElement.fieldGroup.name
        typeGroup = fieldElement.fieldGroup.fieldGroupType
      }
    }

    fieldElement.groupAssigned = currentGroup
    fieldElement.typeGroupAssigned = typeGroup
  })

  return fieldList
}
