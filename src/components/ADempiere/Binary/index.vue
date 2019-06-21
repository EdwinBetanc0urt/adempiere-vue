<template>
  <el-upload
    v-model="value"
    :limit="metadata.Limit"
    :on-remove="handleRemove"
    :on-success="handleSuccess"
    :on-error="handleError"
    class="image-uploader"
    action="https://jsonplaceholder.typicode.com/posts/"
    @change="handleChange"
  >
    <el-button size="small" type="primary">
      Upload File
    </el-button>
    <div slot="tip" class="el-upload__tip">
      Only files with a size smaller than 500kb
    </div>
  </el-upload>
</template>

<script>
export default {
  name: 'Binary',
  props: {
    metadata: {
      type: Object,
      required: true
    },
    valueModel: {
      type: String,
      default: undefined
    }
  },
  data() {
    return {
      value: this.metadata.value
    }
  },
  watch: {
    valueModel() {
      this.value = this.valueModel
    }
  },
  beforeMount() {
    // enable to dataTable records
    if (typeof this.valueModel !== 'undefined') {
      this.value = this.valueModel
    }
  },
  methods: {
    handleChange() {
      if (this.metadata.inTable) {
        this.$store.dispatch('notifyCellTableChange', {
          parentUuid: this.metadata.parentUuid,
          containerUuid: this.metadata.containerUuid,
          columnName: this.metadata.columnName,
          newValue: this.value,
          keyColumn: this.metadata.keyColumn,
          tableIndex: this.metadata.tableIndex,
          rowKey: this.metadata.rowKey
        })
      } else {
        this.$store.dispatch('notifyFieldChange', {
          parentUuid: this.metadata.parentUuid,
          containerUuid: this.metadata.containerUuid,
          columnName: this.metadata.columnName,
          newValue: this.value
        })
      }
    },
    handleRemove(file) {
      this.$message.success(`The previously uploaded file has been deleted.`)
    },
    handleError(file) {
      this.$message.error(`The file does not meet the specifications.`)
    },
    handleSuccess(file) {
      this.$message.success(`The file has been successfully loaded.`)
    }
  }
}
</script>
