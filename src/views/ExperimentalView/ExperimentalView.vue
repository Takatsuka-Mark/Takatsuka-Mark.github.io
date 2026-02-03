<script setup lang="ts">
import { useExperimentalView } from './ExperimentalView';

const { 
    container, 
    activeCluster, 
    navigateToCluster, 
    isBackgroundMoving, 
    isTimelineView,
    clusterLabels,
    nodeLabels,
    timelineLabels,
    showIntro,
    selectedExperience,
    overlayPos,
    selectNode,
    getClusterLabel
} = useExperimentalView();
</script>

<template>
  <div class="experimental-container" ref="container">
    
    <!-- Page Title / Breadcrumb -->
    <div class="page-title" @click="navigateToCluster(null)" style="cursor: pointer;">
        {{ activeCluster ? getClusterLabel(activeCluster) : 'Experimental Lab' }}
    </div>

    <!-- Background Toggle -->
    <div class="bg-toggle" @click="isBackgroundMoving = !isBackgroundMoving">
        {{ isBackgroundMoving ? 'PAUSE STARS' : 'PLAY STARS' }}
    </div>

    <!-- Timeline Toggle (Only show if in Experience or Overview?) -->
    <div class="timeline-toggle" @click="isTimelineView = !isTimelineView" v-if="(activeCluster === 'experience' || !activeCluster) && false">
        {{ isTimelineView ? 'SHOW GRAPH' : 'SHOW TIMELINE' }}
    </div>

    <!-- Cluster Headers -->
    <div
        v-if="!isTimelineView"
        v-for="label in clusterLabels"
        :key="label.id"
        class="cluster-label"
        :class="{ 'active': activeCluster === label.id }"
        :style="{
            left: label.x + 'px',
            top: label.y + 'px',
            opacity: label.visible ? (activeCluster === label.id ? 0 : 0.8) : 0,
            transform: `translate(-50%, -50%) scale(${label.scale})`,
            pointerEvents: label.visible ? 'auto' : 'none'
        }"
        @click.stop="navigateToCluster(label.id)"
    >
        {{ label.text }}
    </div>

    <!-- Node Labels -->
    <div 
        v-for="label in nodeLabels" 
        :key="label.id" 
        class="node-label"
        :style="{ 
            left: label.x + 'px', 
            top: label.y + 'px', 
            opacity: label.visible ? 0.7 : 0 
        }"
        @click.stop="selectNode(label.id)"
    >
        {{ label.text }}
    </div>
    
    <!-- Timeline Labels (Years) -->
    <div
        v-if="isTimelineView"
        v-for="label in timelineLabels"
        :key="label.id"
        class="timeline-label"
        :style="{
            left: label.x + 'px',
            top: label.y + 'px',
            opacity: label.visible ? 0.5 : 0
        }"
    >
        {{ label.text }}
    </div>

    <Transition name="fade">
      <div v-if="showIntro" class="intro-overlay">
        <h1 class="intro-text">Experimental V2</h1>
      </div>
    </Transition>
    <Transition name="fade">
      <div 
        v-if="selectedExperience" 
        class="info-card"
        :style="{ left: overlayPos.x + 'px', top: overlayPos.y + 'px' }"
      >
        <div class="card-glass">
            <h3>{{ selectedExperience.company }}</h3>
            <h4>{{ selectedExperience.title }}</h4>
            <p class="date">{{ selectedExperience.date }}</p>
            <div v-if="selectedExperience.details" class="details">
              <ul>
                <li v-for="(d, i) in selectedExperience.details" :key="i">{{ d }}</li>
              </ul>
            </div>
            <a v-if="selectedExperience.link" :href="selectedExperience.link" target="_blank">More Info</a>
            
            <button class="close-btn" @click.stop="() => { selectedExperience = null; }">×</button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped src="./ExperimentalView.scss" lang="scss"/>
