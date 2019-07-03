<template>
  <el-form :label-position="labelPosition" class="table-root">
    <div class="table-header">
      <icon-element v-show="isSearchable" icon="el-icon-search">
        <el-input
          v-model="searchTable"
          size="mini"
          :placeholder="$t('table.dataTable.search')"
          class="header-search-input"
          clearable
        />
      </icon-element>
      <icon-element icon="el-icon-circle-plus">
        <filter-columns
          ref="headerSearchInput"
          :container-uuid="containerUuid"
          :panel-type="panelType"
          class="header-search-input"
        />
      </icon-element>
    </div>
    <el-table
      ref="multipleTable"
      fit
      :height="getHeigthTable"
      style="width: 100%"
      stripe
      border
      :row-key="keyColumn"
      highlight-current-row
      :reserve-selection="true"
      :row-style="rowStyle"
      :data="getDataDetail"
      cell-class-name="datatable-max-cell-height"
      @row-click="handleRowClick"
      @row-dblclick="handleRowDblClick"
      @select="handleSelection"
      @select-all="handleSelectionAll"
    >
      <!--
        <el-table-column
          v-if="isTableSelection"
          type="selection"
          :prop="keyColumn"
          fixed
          min-width="50"
          :class-name="'is-cell-selection'"
        />
      -->
      <template v-for="(item, key) in fieldList">
        <el-table-column
          v-if="isDisplayed(item)"
          :key="key"
          :label="item.name"
          :prop="item.columnName"
          :column-key="item.columnName"
          sortable
          :formatter="changeOrder"
          min-width="200"
          height="300"
          :class-name="cellClass(item)"
        >
          <template slot-scope="scope">
            <template v-if="scope.row.isEdit && (item.isIdentifier || item.isUpdateable)">
              <field
                :is-data-table="true"
                :is-show-label="false"
                :in-table="true"
                :metadata-field="{
                  ...item,
                  displayColumn: scope.row['DisplayColumn_' + item.columnName],
                  tableIndex: scope.$index,
                  rowKey: scope.row[keyColumn],
                  keyColumn: keyColumn
                }"
                :record-data-fields="scope.row[item.columnName]"
                size="mini"
                @keyup.enter.native="confirmEdit(scope.row)"
              />
            </template>
            <span v-else>
              {{ scope.row['DisplayColumn_' + item.columnName] || scope.row[item.columnName] }}
            </span>
          </template>
        </el-table-column>
      </template>
    </el-table>
    <div class="table-footer">
      {{ $t('table.dataTable.selected') }}: {{ getDataSelection.length }} / {{ $t('table.dataTable.records') }}: {{ getDataDetail.length }}
    </div>
  </el-form>
</template>

<script>
import Field from '@/components/ADempiere/Field'
import Sortable from 'sortablejs'
import FilterColumns from '@/components/ADempiere/DataTable/filterColumns'
import IconElement from '@/components/ADempiere/IconElement'

export default {
  name: 'DataTable',
  components: {
    Field,
    FilterColumns,
    IconElement
  },
  props: {
    parentUuid: {
      type: String,
      default: ''
    },
    containerUuid: {
      type: String,
      default: ''
    },
    panelType: {
      type: String,
      default: 'window'
    },
    // Show input section from search in data
    isSearchable: {
      type: Boolean,
      default: false
    },
    // Show check from selection row
    isTableSelection: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      loading: true,
      labelPosition: 'top',
      searchTable: '', // text from search
      showSearch: false, // show input from search,
      panel: {},
      fieldList: [],
      isLoaded: false,
      keyColumn: '', // column as isKey in fieldList
      tableData: [],
      multipleSelection: [],
      isEdit: false, // get data
      rowStyle: { height: '52px' },
      sortable: null,
      oldprocessListData: [],
      newprocessListData: []
    }
  },
  computed: {
    getterPanel() {
      return this.$store.getters.getPanel(this.containerUuid)
    },
    getDataDetail() {
      return this.$store.getters.getDataRecordDetail(this.containerUuid)
    },
    getDataSelection() {
      return this.$store.getters.getDataRecordSelection(this.containerUuid)
    },
    getHeigthTable() {
      if (this.getDataDetail !== 'undefined' && this.panelType !== 'window') {
        return this.$store.getters.getHeigth() - 300
      } else {
        return this.$store.getters.getHeigth() - 400
      }
    }
  },
  watch: {
    isLoaded: function() {
      if (typeof this.tableName !== 'undefined') {
        this.getData(this.tableName)
      }
    }
  },
  created() {
    // get tab with uuid
    this.getPanel()
    this.getList()
  },
  mounted() {
    this.toggleSelection(this.getDataSelection)
  },
  methods: {
    /**
     * ASOCIATE WITH SEARCH INPUT
     */
    handleChangeInput(value) {
      this.toggleSelection(this.getDataSelection)
    },
    async getList() {
      this.oldgetDataDetail = this.getDataDetail.map(v => v.id)
      this.newgetDataDetail = this.oldgetDataDetail.slice()
      this.$nextTick(() => {
        this.setSort()
      })
    },
    setSort() {
      const el = this.$refs.multipleTable.$el.querySelectorAll('.el-table__body-wrapper > table > tbody')[0]
      this.sortable = Sortable.create(el, {
        ghostClass: 'sortable-ghost', // Class name for the drop placeholder,
        setData: function(dataTransfer) {
          // to avoid Firefox bug
          // Detail see : https://github.com/RubaXa/Sortable/issues/1012
          dataTransfer.setData('Text', '')
        },
        onEnd: evt => {
          const targetRow = this.getDataDetail.splice(evt.oldIndex, 1)[0]
          this.getDataDetail.splice(evt.newIndex, 0, targetRow)

          // for show the changes, you can delete in you code
          const tempIndex = this.newgetDataDetail.splice(evt.oldIndex, 1)[0]
          this.newgetDataDetail.splice(evt.newIndex, 0, tempIndex)
        }
      })
    },
    changeOrder() {
      var reversed = this.getDataDetail.reverse()
      return reversed
    },
    /**
     * @param {object} field
     */
    cellClass(field) {
      if (!(field.isIdentifier || field.isUpdateable && !field.isReadOnly)) {
        return 'cell-no-edit'
      }
      // return 'cell-edit'
      return undefined
    },
    /**
     * Select or unselect rows
     * USE ONLY MOUNTED
     */
    toggleSelection(rowsSelection) {
      if (rowsSelection) {
        rowsSelection.forEach(row => {
          this.$refs.multipleTable.toggleRowSelection(row)
        })
      } else {
        this.$refs.multipleTable.clearSelection()
      }
    },
    confirmEdit(row, newValue, value) {
      if (row.isEdit) {
        row.isEdit = false
      }
    },
    handleRowClick(row, column, event) {
      if (!row.isEdit) {
        /*
        var inSelection = this.getDataSelection.some(item => {
          return JSON.stringify(item) === JSON.stringify(row)
        })
        if (inSelection) {
          row.isEdit = true
        }
        */
        row.isEdit = true
      }
    },
    handleRowDblClick(row, column, event) {
      this.confirmEdit(row, null, null)
    },
    handleSelection(rowsSelection, rowSelected) {
      // index.isEdit = !index.isEdit
      // rowSelected.isEdit = !rowSelected.isEdit
      // if (this.isAllSelected(rows.length)) {
      //   index.isEdit = true
      // }
      this.$store.dispatch('recordSelection', {
        containerUuid: this.containerUuid,
        selection: rowsSelection,
        record: this.getDataDetail
      })
    },
    isAllSelected(selection = 0) {
      if (selection > 0) {
        var data = this.$store.getters.getDataRecordDetail(this.containerUuid)
        return data.length === selection
      }
      return false
    },
    handleSelectionAll(rowsSelection) {
      // var selectAll = false
      // if (this.isAllSelected(rowsSelection.length)) {
      //   selectAll = true
      // }
      this.$store.dispatch('recordSelection', {
        containerUuid: this.containerUuid,
        selection: rowsSelection,
        record: this.getDataDetail
      })
      // rowsSelection.forEach(row => {
      //   row.isEdit = selectAll
      // })
    },
    filterResult() {
      var data = []
      data = this.getDataDetail.filter((rowItem) => {
        if (this.searchTable.trim().length > 0) {
          let find = false
          Object.keys(rowItem).forEach(key => {
            // if exists some selection columns
            if (this.panel.selectionColumn.length > 0) {
              if (this.panel.selectionColumn.indexOf(key) > -1 &&
                String(rowItem[key]).includes(String(this.searchTable))) {
                find = true
                return find
              }
            } else {
              // not selection column, search in all rows
              if (String(rowItem[key]).includes(String(this.searchTable))) {
                find = true
                return find
              }
            }
          })
          return find
        }
        return true
      })
      return data
    },
    /**
     * Verify is displayed field in column table
     */
    isDisplayed(field) {
      var isDisplayed = field.isDisplayed && field.isDisplayedFromLogic && field.isShowedTableFromUser
      //  Verify for displayed and is active
      return field.isActive && isDisplayed
    },
    /**
     * Get the tab object with all its attributes as well as the fields it contains
     */
    getPanel() {
      var panel = this.getterPanel
      if (typeof panel === 'undefined' || panel.fieldList.length === 0) {
        this.$store.dispatch('getPanelAndFields', {
          containerUuid: this.containerUuid,
          type: this.panelType.trim()
        }).then(response => {
          this.panel = response
          this.generatePanel()
        }).catch(err => {
          console.warn('Field Load Error ' + err.code + ': ' + err.message)
          this.isLoaded = false
        })
      } else {
        this.panel = panel
        this.generatePanel()
      }
    },
    generatePanel() {
      var panel = this.panel
      this.keyColumn = panel.keyColumn
      this.fieldList = this.sortFields(panel.fieldList)
      this.isLoaded = true
      // this.fieldList = this.sortFields(panel.fieldList, 'SortNo')
      if (this.isEdit && this.panelType === 'window') {
        this.getData(this.tableName)
      }
    },
    /**
     * Sorts the column components according to the value that is obtained from
     * the array that contains the JSON objects in the data.SortNo property
     * @param  {array} arr
     * @return {array} order by arr.data.SortNo
     */
    sortFields(arr, orderBy = 'sequence', type = 'asc') {
      arr.sort((itemA, itemB) => {
        return itemA[orderBy] - itemB[orderBy]
        // return itemA[orderBy] > itemB[orderBy]
      })
      if (type.toLowerCase() === 'desc') {
        return arr.reverse()
      }
      return arr
    }
  }
}
</script>

<style>
  /* style in cursor if cell is no edit */
  .cell-no-edit {
    cursor: not-allowed !important;
  }
  .cell-edit {
    cursor: pointer !important;
  }
  .el-table th, .el-table td {
    padding: 12px 0;
    min-width: 0;
    height: 64px;
    max-height: 407px;
    -webkit-box-sizing: border-box;
    box-sizing: border-box;
    text-overflow: ellipsis;
    vertical-align: middle;
    position: relative;
    text-align: left;
  }
</style>
<style lang="scss" scoped>
  .table-root {
    background-color: #f5f7fa;

    .datatable-max-cell-height {
      max-height: 52px;
    }

    .table-header {
      text-align: right;
      padding: 5px;
      width: 100%;
      border: 1px solid transparent;
      // position: fixed;
      // display: inline-block;
      // float: right;
      // line-height: 25px;
    }
    .table-footer {
      bottom: 0px;
      text-align: right;
      padding: 10px;
    }
  }

</style>
