<script setup lang="ts">
import Container from '@/components/Container/Container.vue';
import { experiences, education } from '@/data/experiences';
</script>

<template>
  <div>
    <div class="center_column">
      <!-- Intro -->
      <Container class="intro_container" :HT="true" :HT_Right="false" container_title="" :FULL="false">
        <template v-slot:ht_title>
          ◝ʕ •ᴥ• ʔ◜
        </template>
        <template v-slot:ht_body>
          <h1>Welcome!</h1>
        </template>
      </Container>
      <!-- Employment -->
      <Container class="employment_container"  :HT="true" :HT_Right="false" container_title="" :FULL="false">
        <template v-slot:ht_title>
          Employment
        </template>
        <template v-slot:ht_body>
          <div v-for="(job, index) in experiences" :key="index">
            <h2><b>{{ job.company }}</b></h2>
            <h3>{{ job.title }}</h3>
            <h4>{{ job.date }}</h4>
            <br v-if="index < experiences.length - 1">
          </div>
        </template>
      </Container>
      <!-- Education -->
      <Container class="education_container"  :HT="true" :HT_Right="false" container_title="" :FULL="false"> <!-- Want right aligned, but top mobile -->
        <template v-slot:ht_title>
          Education
        </template>
        <template v-slot:ht_body>
          <div v-for="(edu, index) in education" :key="index">
            <h2><b>{{ edu.company }}</b></h2>
            <h3>{{ edu.title }}</h3>
            <h3 v-for="detail in edu.details" :key="detail">{{ detail }}</h3>
            <h4>{{ edu.date }}</h4>
          </div>
        </template>
      </Container>
      <!-- Projects -->
      <!-- <Container class="projects_container" :HT="true" :HT_Right="false" container_title="" :FULL="false">
        <template v-slot:ht_title>
          Projects
        </template>
        <template v-slot:ht_body>
          <router-link to="/math" class="sidebar-link">
            <h2>Math Interpreter</h2>
          </router-link>
        </template>
      </Container> -->
      <!-- Contact -->
      <Container class="contact_container"  :HT="true" :HT_Right="false" container_title="" :FULL="false"> <!-- Want right aligned, but top on mobile -->
        <template v-slot:ht_title>
          Contact
        </template>
        <template v-slot:ht_body>
          <h3>
            Connect with me on LinkedIn:
            <br>
            <a :href="'//www.linkedin.com/in/mark-takatsuka'" target="_blank">
              linkedin.com/in/mark-takatsuka
            </a>
          </h3>
        </template>
      </Container>
    </div>
  </div>
</template>

<style src="./HomeView.scss" lang="scss"/>
