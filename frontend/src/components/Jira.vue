<template>
  <div>
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
    name: 'jira',
    created: function () {
      this.getJiraVersions()
    },
    data () {
      return {
        jiraVersions: undefined,
        selectedJiraVersion: undefined
      }
    },

    computed: {
      itemsInVersion: function () {
        return [this.selectedJiraVersion + ' go', this.selectedJiraVersion + ' go', this.selectedJiraVersion + ' gadget']
      }
    },
    methods: {
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

</style>
