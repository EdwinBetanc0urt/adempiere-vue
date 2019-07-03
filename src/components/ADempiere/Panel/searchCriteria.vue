<template>
  <div>
    <el-button v-show="!showCriteria" icon="el-icon-search" type="text" class="open" @click="handleChange()"> {{ $t('views.searchCriteria') }} </el-button>
    <el-button v-show="showCriteria" icon="el-icon-close" type="text" class="close" @click="handleChange()" />
    <div>
      <el-collapse-transition>
        <div v-show="showCriteria" :is-params-criteria="false">
          <div class="transition-box">
            <slot />
          </div>
        </div>
      </el-collapse-transition>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PanelDetail',
  props: {
    isEdit: {
      type: Boolean,
      default: false
    },
    panelType: {
      type: String,
      default: 'window'
    },
    containerUuid: {
      type: String,
      default: undefined
    },
    isShowedCriteria: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      showCriteria: this.isShowedCriteria
    }
  },
  methods: {
    handleChange() {
      this.showCriteria = !this.showCriteria
      this.$store.dispatch('changeShowedDetail', {
        panelType: this.panelType,
        containerUuid: this.containerUuid,
        isShowedCriteria: this.showCriteria
      })
    }
  }
}
</script>

<style scoped>
  .containert {
    padding-left: 20px;
    padding-right: 20px;
    width: 100%;
  }
  .title{
    color: #000000;
    text-size-adjust: 20px;
    font-size: 100%;
    font-weight: 605!important;
    position: relative;
    left: 40%;
  }
  .close{
    color: #000000;
    text-size-adjust: 20px;
    font-size: 150%;
    font-weight: 605!important;
    position: relative;
    left: 96%;
  }
  .open{
    color: #000000;
    text-size-adjust: 20px;
    font-size: 100%;
    font-weight: 605!important;
    padding-right: 12px;
    float: right;
  }
</style>
