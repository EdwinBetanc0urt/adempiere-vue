<template>
  <div :class="isMobileClassmenu() + ' container-context-menu'">
    <el-menu :default-active="activeMenu" :router="false" class="el-menu-demo" mode="horizontal" menu-trigger="hover" unique-opened>
      <el-submenu v-if="device==='mobile'" class="el-menu-item" index="1">
        <template slot="title">
          <i class="el-icon-more" />
        </template>
        <el-submenu v-if="relations !== undefined && relations.length > 0" class="el-menu-item" :index="indexMenu() + '1'">
          <template slot="title">
            Relations
          </template>
          <el-scrollbar wrap-class="scroll">
            <item v-for="(relation, index) in relations" :key="index" :item="relation" />
          </el-scrollbar>
        </el-submenu>
        <el-menu-item v-else disabled :index="indexMenu() + '1'">
          Relations
        </el-menu-item>
        <el-submenu class="el-menu-item" :index="indexMenu() + '2'">
          <template slot="title">
            Actions
          </template>
          <el-menu-item v-for="(action, index) in actions" :key="index" :index="action.name" @click="runAction(action)">
            {{ action.name }}
          </el-menu-item>
        </el-submenu>
        <el-menu-item :index="indexMenu() + '3'">
          References
        </el-menu-item>
      </el-submenu>
      <template v-else class="container-submenu">
        <el-submenu v-if="relations !== undefined && relations.length > 0" class="el-menu-item" index="1">
          <template slot="title">
            Relations
          </template>
          <el-scrollbar wrap-class="scroll">
            <item v-for="(relation, index) in relations" :key="index" :item="relation" />
          </el-scrollbar>
        </el-submenu>
        <el-menu-item v-else disabled index="1">
          Relations
        </el-menu-item>
        <el-submenu v-if="actions !== undefined && actions.length > 0" class="el-menu-item" index="2">
          <template slot="title">
            Actions
          </template>
          <template v-for="(action, index) in actions">
            <el-submenu v-if="action.childs" :key="index" :index="action.name">
              <template slot="title">
                {{ action.name }}
              </template>
              <el-menu-item v-for="(child, key) in action.childs" :key="key" :index="child.uuid" @click="runAction(child)">
                {{ child.name }}
              </el-menu-item>
            </el-submenu>
            <el-menu-item v-else :key="index" :index="action.name" :disabled="action.disabled" @click="runAction(action)">
              {{ action.name }}
            </el-menu-item>
          </template>
        </el-submenu>
        <el-menu-item v-else disabled index="2">
          Actions
        </el-menu-item>
        <el-menu-item index="3">
          References
        </el-menu-item>
      </template>
    </el-menu>
  </div>
</template>

<script>
import ResizeMixin from '@/layout/mixin/ResizeHandler'
import Item from './items'

export default {
  name: 'ContextMenu',
  components: {
    Item
  },
  mixins: [ResizeMixin],
  props: {
    parentUuid: {
      type: String,
      default: undefined
    },
    parentPanel: {
      type: String,
      default: undefined
    },
    report: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      relations: this.$store.getters.getRelations(this.$route.meta.parentUuid),
      actions: [],
      references: []
    }
  },
  computed: {
    activeMenu() {
      const route = this.$route
      const { meta, path } = route
      // if set path, the sidebar will highlight the path you set
      if (meta.activeMenu) {
        return meta.activeMenu
      }
      return path
    },
    sidebar() {
      return this.$store.state.app.sidebar
    },
    device() {
      return this.$store.state.app.device
    },
    classObj() {
      return {
        hideSidebar: !this.sidebar.opened,
        openSidebar: this.sidebar.opened,
        withoutAnimation: this.sidebar.withoutAnimation,
        mobile: this.device === 'mobile'
      }
    },
    isReport() {
      if (this.report === true) {
        return true
      }
      return false
    }
  },
  created() {
    this.subscribeChanges()
  },
  methods: {
    isMobileClassmenu() {
      const cssClass = 'container-submenu'
      if (this.device === 'mobile') {
        return cssClass + '-mobile'
      }
      return cssClass
    },
    indexMenu(index = '') {
      if (this.device === 'mobile') {
        return index + '1-'
      }
      return index
    },
    showModal(action) {
      var processData = this.$store.getters.getProcess(action.uuid)
      if (typeof processData === 'undefined') {
        this.$store.dispatch('getProcessFromServer', action.uuid)
          .then(response => {
            this.$store.dispatch('setShowDialog', response)
          }).catch(err => {
            console.warn('ContextMenu: Dictionary Process (State) - Error ' + err.code + ': ' + err.message)
          })
      } else {
        this.$store.dispatch('setShowDialog', processData)
      }
    },
    subscribeChanges() {
      this.$store.subscribe(mutation => {
        if (mutation.type === 'reloadContextMenu') {
          this.actions = this.$store.getters.getActions(mutation.payload.containerUuid)
          if (typeof this.actions !== 'undefined') {
            this.actions.forEach((item) => {
              if (typeof item.disabled === 'undefined') {
                item['disabled'] = false
              }
            })
            if (this.$route.name !== 'Report Viewer') {
              var index = this.actions.findIndex(item => item.action === 'changeParameters')
              if (index !== -1) {
                this.actions[index].disabled = true
              }
            }
          }
          if (typeof this.$route.meta.parentUuid !== 'undefined') {
            this.relations = this.$store.getters.getRelations(this.$route.meta.parentUuid)
          }
        }
      })
    },
    runAction(action) {
      if (action.type === 'action') {
        var finalParameters = this.$store.getters.getParamsProcessToServer(this.$route.meta.uuid)
        if ((finalParameters.fieldsMandatory > 0 && finalParameters.params.length > 0) || finalParameters.fieldsMandatory === 0) {
          this.$store.dispatch(action.action, {
            action: action,
            containerUuid: this.$route.meta.uuid, // EVALUATE IF IS action.uuid
            parentUuid: this.parentUuid,
            parentPanel: this.parentPanel,
            processName: this.$route.meta.title
          })
          if (action.isReport) {
            this.$store.subscribeAction({
              after: (action, state) => {
                if (action.type === 'finishProcess') {
                  if (!action.payload.isError) {
                    this.$router.push({
                      name: 'Report Viewer',
                      params: {
                        processUuid: action.payload.processUuid,
                        instanceUuid: action.payload.instanceUuid,
                        fileName: action.payload.output.fileName
                      }
                    })
                  }
                }
              }
            })
          } else {
            this.$router.push('/')
          }
          this.$store.dispatch('tagsView/delView', this.$route)
        } else {
          this.$notify.info({
            title: 'Info',
            message: 'Some params empty.'
          })
        }
      } else if (action.type === 'process') {
        this.showModal(action)
      }
    }
  }
}
</script>

<style>
  .container-context-menu {
    z-index: 1;
  }

  .container-submenu-mobile{
    position: relative;
    height: 39px !important;
    width: 39px !important;
    float: right;
  }

  .container-submenu{
    position: relative;
    height: 39px !important;
    float: right;
  }

  ul.el-menu-demo > .el-menu-item {
    height: 39px !important;
    line-height: 39px !important;
    padding: 0 10px;
  }

  .el-menu-demo > .el-menu-item > .el-submenu__title{
    line-height: 39px;
    height: 39px !important;
    padding: 0;
  }

  .el-menu--horizontal .el-submenu > .el-menu--horizontal {
    left: initial !important;
    right: 150px;
  }

  .el-menu--popup-bottom-start{
    min-width: 150px !important;
  }

  .el-menu--popup-right-start{
    min-width: 150px !important;
  }

  .el-menu--popup-right-start > .el-menu-item{
    min-width: 150px;
  }

  .scroll {
    max-height: 400px;
  }

  .el-icon-more {
    transform: rotate(90deg);
  }
</style>
