<template>
  <div class="hello">
    <template v-if="!currentRelease">
      <a href="javascript:" v-on:click="startRelease">Start a new release right now?</a>
    </template>
    <template v-else>
      <div>
        <button v-on:click="cancelRelease">cancel release</button>
        <button v-on:click="updateRelease">store release</button>
      </div>
      <label>version</label>
      <input v-model="currentRelease.version" placeholder="version">
      <ol>
        <li v-for="item in currentRelease.items" :key="item.name">
          <a :href="item.link" target="_blank">{{item.name}}</a>
          <textarea v-model="item.text" placeholder="release note"></textarea>
        </li>
      </ol>
    </template>
    <ul>
      <li v-for="version in jiraVersions" :key="version.id">
        <button v-on:click="onJiraVersionSelected(version.id)">{{version.name}}</button>
        <a :href="version.link" target="_blank">{{version.name}}</a>
      </li>
    </ul>
    <div v-if="selectedJiraVersion">
      <span v-for="item in itemsInVersion">{{item}}</span>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'hello',
    created: function () {
      this.getJiraVersions()
      this.getCurrentRelease()
    },
    data () {
      return {
        jiraVersions: undefined,
        selectedJiraVersion: undefined,
        currentRelease: undefined
      }
    },

    computed: {
      itemsInVersion: function () {
        return [this.selectedJiraVersion + ' go', this.selectedJiraVersion + ' go', this.selectedJiraVersion + ' gadget']
      }
    },
    methods: {
      startRelease: function () {
        const vm = this
        this.$http.post('http://localhost:3000/releases/current', {})
          .then(response => {
            vm.currentRelease = response.body
          })
          .catch(e => console.log('failed to start a new release' + e))
      },
      getCurrentRelease: function () {
        const vm = this
        this.$http.get('http://localhost:3000/releases/current')
          .then(response => {
            vm.currentRelease = response.body
          })
          .catch(e => {
            if (e.status !== 404) {
              console.log('failed to fetch current release' + JSON.stringify(e))
            }
          })
      },
      updateRelease: function () {
        this.$http.put('http://localhost:3000/releases/current', this.currentRelease).catch(e => 'failed to store release')
      },
      cancelRelease: function () {
        const vm = this
        this.$http.delete('http://localhost:3000/releases/current')
          .then(() => {
            vm.currentRelease = undefined
          })
          .catch(e => console.log('failed to cancel release' + JSON.stringify(e)))
      },
      getJiraVersions: function () {
        const vm = this
        this.$http.get('http://localhost:3000/jira/versions')
          .then(response => {
            vm.jiraVersions = response.body
          })
          .catch(e => {
            console.log('failed to fetch jira versions' + JSON.stringify(e))
          })
      },
      onJiraVersionSelected: function (versionId) {
        this.selectedJiraVersion = this.selectedJiraVersion === versionId ? undefined : versionId
      }
    }
  }
</script>

<style scoped>
  ol {
    list-style-type: none;
  }
</style>
