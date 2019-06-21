<template>
  <el-form :label-position="labelPosition">
    <br>
    <div v-show="isSearchable" :class="{'show-input-seacrh':showSearch}" class="search-detail" align="right">
      <svg-icon class-name="search-icon" icon-class="search" @click.stop="click" @submit.prevent.native="false" />
      <el-input
        ref="headerSearchInput"
        v-model="searchTable"
        size="mini"
        :placeholder="$t('table.search')"
        class="header-search-input"
        clearable
      />
    </div>

    <!--
      Add this prop to el-table later fix Duplicate keys records
      :row-key="keyColumn"
    -->
    <el-table
      ref="multipleTable"
      fit
      height="200"
      style="width: 100%"
      stripe
      border
      highlight-current-row
      :reserve-selection="true"
      :row-style="rowStyle"
      :data="getDataDetail"
      @row-click="handleRowClick"
      @row-dblclick="handleRowDblClick"
      @select="handleSelection"
      @select-all="handleSelectionAll"
    >
      <el-table-column
        v-if="isTableSelection"
        type="selection"
        :prop="keyColumn"
        fixed
        min-width="50"
        :class-name="'is-cell-selection'"
      />
      <template v-for="(item, key) in fieldList">
        <el-table-column
          v-if="isDisplayed(item)"
          :key="key"
          :label="item.name"
          :prop="item.columnName"
          :column-key="item.columnName"
          min-width="150"
          :class-name="cellClass(item)"
        >
          <template slot-scope="scope">
            <template v-if="scope.row.edit && (item.isIdentifier || item.isUpdateable)">
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
  </el-form>
</template>

<script>
import Field from '@/components/ADempiere/Field'
export default {
  name: 'DataTable',
  components: {
    Field
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
      default: true
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
      edit: false,
      rowStyle: { height: '52px' }
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
    }
  },
  watch: {
    isLoaded: function() {
      if (typeof this.tableName !== 'undefined') {
        this.getData(this.tableName)
      }
    },
    showSearch(value) {
      if (value) {
        document.body.addEventListener('click', this.close)
      } else {
        document.body.removeEventListener('click', this.close)
      }
    }
  },
  created() {
    // get tab with uuid
    this.getPanel()
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
    click() {
      if (this.searchTable.trim().length > 0) {
        this.showSearch = true
      } else {
        this.showSearch = !this.showSearch
      }
      if (this.showSearch) {
        this.$refs.headerSearchInput && this.$refs.headerSearchInput.focus()
      }
    },
    close() {
      if (this.searchTable.trim().length > 0) {
        this.showSearch = true
      } else {
        this.$refs.headerSearchInput && this.$refs.headerSearchInput.blur()
        this.showSearch = false
      }
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
      if (row.edit) {
        row.edit = false
        this.$message({
          message: 'The title has been edited',
          type: 'success'
        })
      }
    },
    handleRowClick(row, column, event) {
      if (!row.edit) {
        /*
        var inSelection = this.getDataSelection.some(item => {
          return JSON.stringify(item) === JSON.stringify(row)
        })
        if (inSelection) {
          row.edit = true
        }
        */
        row.edit = true
      }
    },
    handleRowDblClick(row, column, event) {
      this.confirmEdit(row, null, null)
    },
    handleSelection(rowsSelection, rowSelected) {
      // index.edit = !index.edit
      // rowSelected.edit = !rowSelected.edit
      // if (this.isAllSelected(rows.length)) {
      //   index.edit = true
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
      //   row.edit = selectAll
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
      var isDisplayed = field.isDisplayed && field.isDisplayedFromLogic
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
</style>
<style lang="scss" scoped>
  .search-detail {
    font-size: 0 !important;
    width: 98%;
    .search-icon {
      // cursor: pointer;
      // font-size: 18px;
      // vertical-align: middle;
      cursor: pointer;
      font-size: 18px;
      color: #000;
      position: absolute;
      vertical-align: middle;
      // left: 2px;
    }
    .container-table {
      width: 100%;
      height: 90%;
    }
    .header-search-input {
      font-size: 12px;
      transition: width 0.2s;
      width: 0;
      overflow: hidden;
      background: transparent;
      border-radius: 0;
      display: inline-block;
      vertical-align: middle;

      /deep/ .el-input__inner {
        border-radius: 0;
        border: 0;
        padding-left: 0;
        padding-right: 0;
        box-shadow: none !important;
        border-bottom: 1px solid #d9d9d9;
        vertical-align: middle;
      }
    }
    &.show-input-seacrh {
      .header-search-input {
        width: 200px;
        margin-left: 22px;
      }
    }
  }
</style>
