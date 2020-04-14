<template>
  <el-dropdown trigger="click" @visible-change="focusCalc">
    <el-button type="text" :disabled="fieldAttributes.readonly">
      <i class="el-icon-s-operation el-icon--right" />
    </el-button>
    <el-dropdown-menu
      slot="dropdown"
      class="dropdown-calc"
    >
      <el-input
        ref="calculatorInput"
        v-model="calcValue"
        class="calc-input"
        clearable
        @input="validateInput"
        @keydown.native="calculateValue"
        @keyup.enter.native="changeValue"
      >
        <template slot="append">
          {{ valueToDisplay }}
        </template>
      </el-input>
      <el-table
        ref="calculator"
        :data="tableData"
        style="width: 100%"
        border
        :show-header="false"
        :span-method="spanMethod"
        class="calc-table"
        @cell-click="sendValue"
      >
        <el-table-column
          align="center"
          prop="row1"
          height="50"
          width="50"
        >
          <template slot-scope="{ row, column }">
            <el-button type="text" :disabled="isDisabled(row, column)">
              {{ row.row1.value }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column
          align="center"
          prop="row2"
          height="50"
          width="50"
        >
          <template slot-scope="{ row, column }">
            <el-button type="text" :disabled="isDisabled(row, column)">
              {{ row.row2.value }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column
          align="center"
          prop="row3"
          height="50"
          width="50"
        >
          <template slot-scope="{ row, column }">
            <el-button type="text" :disabled="isDisabled(row, column)">
              {{ row.row3.value }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column
          align="center"
          prop="row4"
          height="50"
          width="50"
        >
          <template slot-scope="{ row, column }">
            <el-button type="text" :disabled="isDisabled(row, column)">
              {{ row.row4.value }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column
          align="center"
          prop="row5"
          height="50"
          width="50"
        >
          <template slot-scope="{ row, column }">
            <el-button type="text" :disabled="isDisabled(row, column)">
              {{ row.row5.value }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dropdown-menu>
  </el-dropdown>
</template>

<script>
export default {
  name: 'FieldCalc',
  props: {
    fieldAttributes: {
      type: Object,
      required: true
    },
    fieldValue: {
      type: Number,
      default: undefined
    }
  },
  data() {
    return {
      calcValue: this.fieldValue,
      valueToDisplay: '',
      tableData: [{
        row1: {
          type: 'operator',
          value: '%'
        },
        row2: {
          type: 'operator',
          value: '/'
        },
        row3: {
          type: 'operator',
          value: '*'
        },
        row4: {
          type: 'operator',
          value: '-'
        },
        row5: {
          type: 'clear',
          value: 'C'
        }
      }, {
        row1: {
          type: 'value',
          value: '7'
        },
        row2: {
          type: 'value',
          value: '8'
        },
        row3: {
          type: 'value',
          value: '9'
        },
        row4: {
          type: 'operator',
          value: '+'
        },
        row5: {
          type: 'clear',
          value: 'AC'
        }
      }, {
        row1: {
          type: 'value',
          value: '4'
        },
        row2: {
          type: 'value',
          value: '5'
        },
        row3: {
          type: 'value',
          value: '7'
        },
        row4: {
          type: 'operator',
          value: '('
        },
        row5: {
          type: undefined,
          value: undefined
        }
      }, {
        row1: {
          type: 'value',
          value: '1'
        },
        row2: {
          type: 'value',
          value: '2'
        },
        row3: {
          type: 'value',
          value: '3'
        },
        row4: {
          type: 'result',
          value: '='
        },
        row5: {
          type: 'operator',
          value: ')'
        }
      }, {
        row1: {
          type: 'value',
          value: '0'
        },
        row2: {
          type: 'operator',
          value: '.'
        },
        row3: {
          type: 'operator',
          value: '+/-'
        },
        row4: {
          type: undefined,
          value: undefined
        },
        row5: {
          type: undefined,
          value: undefined
        }
      }]
    }
  },
  watch: {
    fieldValue(value) {
      this.calcValue = value
    }
  },
  methods: {
    sendValue(row, column) {
      const isAcceptedType = ['result', 'clear'].includes(row[column.property].type)
      if (!isAcceptedType && !this.isDisabled(row, column)) {
        if (this.isEmptyValue(this.calcValue)) {
          this.calcValue = row[column.property].value
        } else {
          const { selectionStart, selectionEnd } = this.$refs.calculatorInput.$refs.input
          let text = row[column.property].value // char clicked
          // separate positions
          const firstText = String(this.calcValue).slice(0, selectionStart)
          const secondText = String(this.calcValue).slice(selectionEnd)
          text = firstText.concat(text).concat(secondText) // insert char clicked
          this.calcValue = text
        }
        const result = this.calculationValue(this.calcValue, event)
        if (!this.isEmptyValue(result)) {
          this.valueToDisplay = result
        } else {
          this.valueToDisplay = '...'
        }
      }
      if (row[column.property].type === 'clear') {
        if (row[column.property].value === 'C') {
          let { selectionStart, selectionEnd } = this.$refs.calculatorInput.$refs.input
          if (selectionStart === String(this.calcValue).length) {
            // cursor in end line, without selection
            selectionStart = 0
            selectionEnd = -1
            this.calcValue = String(this.calcValue).slice(selectionStart, selectionEnd)
          } else if (selectionStart === selectionEnd) {
            // cursor into line without selection
            selectionStart--
            const firstText = String(this.calcValue).slice(0, selectionStart)
            const secondText = String(this.calcValue).slice(selectionEnd)
            this.calcValue = firstText.concat(secondText)
          } else {
            // cursor with selection
            const firstText = String(this.calcValue).slice(0, selectionStart)
            const secondText = String(this.calcValue).slice(selectionEnd)
            this.calcValue = firstText.concat(secondText)
          }
          this.valueToDisplay = this.calcValue
        } else if (row[column.property].value === 'AC') {
          this.calcValue = ''
          this.valueToDisplay = ''
        }
      }
      if (row[column.property].value === '=') {
        this.changeValue()
      }
    },
    validateInput(value) {
      this.calcValue = String(value)
        .replace(/[^0-9.+*\-\/%=]/g, '')
    },
    changeValue() {
      let newValue
      if (!this.isEmptyValue(this.valueToDisplay)) {
        newValue = Number(this.valueToDisplay)
      }

      let isSendCallout = true
      const isSendToServer = true
      if (this.fieldAttributes.isAdvancedQuery) {
        isSendCallout = false
      }

      this.$store.dispatch('notifyFieldChange', {
        parentUuid: this.fieldAttributes.parentUuid,
        containerUuid: this.fieldAttributes.containerUuid,
        field: this.fieldAttributes,
        panelType: this.fieldAttributes.panelType,
        columnName: this.fieldAttributes.columnName,
        newValue,
        isAdvancedQuery: this.fieldAttributes.isAdvancedQuery,
        isSendToServer,
        isSendCallout
      })
        .finally(() => {
          // hidden calc dropdown
          this.$children[0].visible = false
        })
    },
    spanMethod({ row, column, rowIndex, columnIndex }) {
      if (rowIndex === 1) {
        if (row[column.property].value === '+') {
          return {
            rowspan: 2,
            colspan: 1
          }
        }
      } else if (rowIndex === 2) {
        if (this.isEmptyValue(row[column.property].value)) {
          return {
            rowspan: 0,
            colspan: 0
          }
        }
      } else if (rowIndex === 3) {
        if (row[column.property].value === '=') {
          return {
            rowspan: 2,
            colspan: 1
          }
        }
      } else if (rowIndex === 4) {
        if (row[column.property].value === '0') {
          return {
            rowspan: 1,
            colspan: 2
          }
        } else if (this.isEmptyValue(row[column.property].value)) {
          return {
            rowspan: 0,
            colspan: 0
          }
        }
      }
    },
    isDisabled(row, column) {
      const isInteger = ['Integer', 'ID'].includes(this.fieldAttributes.referenceType)
      const value = row[column.property].value
      if (isInteger && value === ',') {
        return true
      }
      return false
    },
    calculateValue(event) {
      let result = this.calculationValue(this.fieldValue, event)
      if (this.isEmptyValue(result)) {
        result = '...'
      }
      this.valueToDisplay = result
    },
    focusCalc(isShowed) {
      if (isShowed) {
        this.calcValue = this.fieldValue
        this.valueToDisplay = this.calcValue
        this.$refs.calculatorInput.focus()
      }
    }
  }
}
</script>

<style>
  .el-table--enable-row-hover .el-table__body tr:hover > td {
    background-color: #ffffff !important;
  }
  .calc-table .el-table__body-wrapper > table {
    border-spacing: 5px;
  }
  .calc-table .el-table__body tr > td {
    box-shadow: 0px 0px 3px 0px rgba(0,0,0,0.5);
    border-radius: 5px;
    cursor: pointer;
  }
</style>
