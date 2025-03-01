<script lang="ts" setup>
import { ComicDetail, Comment } from '@/types';
import { historyAddComic } from '@/utils/localDb';
import { server } from 'process';

const currentPage = ref<number>(1);
const inputRangeVal = ref<number>(1);
const commentPage = ref<number>(0);

const firstRender = ref<boolean>(true);

const openEpisode = ref<boolean>(false);
const showToolbar = ref<boolean>(true);
const openComments = ref<boolean>(false);
const isFetching = ref<boolean>(false);
const isEnd = ref<boolean>(false);
const isChangingEpisode = ref<boolean>(false);

const comments = ref<Comment[]>([]);

const route = useRoute();
const config = useRuntimeConfig();
const { chapterId, comicId } = route.params;
const chapterIdStr = Array.isArray(chapterId) ? chapterId[0] : chapterId;

const [
    comicDetail
  ] = await Promise.all([
      useFetchData(`/truyen-tranh/${comicId}`),
]);

const comic = comicDetail.data.item;
const chapters = Array.isArray(comic.chapters) ? comic.chapters : [];
const serverData = Array.isArray(chapters[0].server_data) ? chapters[0].server_data : [];

let matchedData = null;

for (const chapter of serverData) {
    if (chapter.chapter_name === chapterIdStr) {
        matchedData = chapter;
        break;
    }
}

const chapterApiData = matchedData.chapter_api_data;
const [
    chapterData
  ] = await Promise.all([
      useFetchData_2(`${chapterApiData}`),
    ]);

// **** DataApi **** //
const apiData = chapterData.data
const apiItem = chapterData.data.item
const dataImages = chapterData.data.item.chapter_image


if (apiItem.chapter_image.length === 0 && apiItem.comic_name === '') {
  throw createError({ statusCode: 404, statusMessage: 'Page Not Found' });
}

const getComments = async () => {
  try {
    isFetching.value = true;
    commentPage.value += 1;
    const data = await useFetchData(
      `/comics/${comicId}/comments?chapter=${
        chapters.length === 1 ? -1 : chapterId
      }&page=${commentPage.value}`
    );
    comments.value = [...comments.value, ...data.comments];
    if (commentPage.value >= data.total_pages) isEnd.value = true;
    return data.total_comments;
  } catch (err) {
    console.log(err);
  } finally {
    isFetching.value = false;
  }
};

const quantityChapter = serverData.length;
console.log(serverData);

const maxChapter = serverData[quantityChapter - 1];
const maxNameChapter = maxChapter.chapter_name

const handleChangeEpisode = (type: 'prev' | 'next') => {
  isChangingEpisode.value = true;
  const checkChapter = serverData.findIndex( (i: { chapter_name: string; }) => i.chapter_name === chapterIdStr)
  if(type == 'prev'){
    const prevChapterIdx = serverData[checkChapter - 1].chapter_name; 
    navigateTo(`/truyen-tranh/${comicId}/${prevChapterIdx}`);
  }else{
    const nextChapterIdx = serverData[checkChapter + 1].chapter_name;
    navigateTo(`/truyen-tranh/${comicId}/${nextChapterIdx}`);
  }
};

const handleShowToolbar = (e: Event) => {
  if (e.target !== e.currentTarget) return;
  showToolbar.value = !showToolbar.value;
  openEpisode.value = false;
};

const onCloseComments = (e: Event) => {
  if (e.target !== e.currentTarget) return;
  openComments.value = false;
};

const onOpenEpisodes = () => {
  openEpisode.value = !openEpisode.value;
  if (openEpisode.value) {
    document.getElementById(chapterId as string)?.scrollIntoView();
  }
};

const handleDownload = async () => {
  try {
    const href = `/download?comicId=${comicId}&chapterId=${chapterId}`;
    const a = document.createElement('a');
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(href);
  } catch (err) {
    console.log(err);
  }
};

watch(inputRangeVal, (newValue) => {
  const el = document.getElementById(newValue.toString());
  el?.scrollIntoView();
});

const getElementsPos = () => {
  const elements = document.querySelectorAll('.image-source');
  const foundEle = Array.from(elements).find((el) => {
    const rect = el.getBoundingClientRect();
    return rect.top > 0;
  });
  if (foundEle) {
    currentPage.value = Number(foundEle.getAttribute('id')) - 1;
    return;
  }
  if (firstRender.value) {
    currentPage.value = 1;
    firstRender.value = false;
    return;
  }
  currentPage.value = elements.length;
};

const totalComments = await getComments();

onBeforeUnmount(() => document.removeEventListener('scroll', getElementsPos));

watch(openComments, (status) => {
  document.body.style.overflow = status ? 'hidden' : 'auto';
});

useSeoMeta(
  meta({
    title: `${apiItem.comic_name} - ${apiItem.chapter_name} | STORIES`,
  })
);
useServerSeoMeta(
  meta({
    title: `${apiItem.comic_name} - ${apiItem.chapter_name} | STORIES`,
  })
);
</script>

<template>
  <main class="bg-zinc-900 min-h-screen pt-[50px]">
    <div class="flex flex-col max-w-2xl mx-auto">
      <span
        v-if="isChangingEpisode"
        v-for="(_, idx) in new Array(20)"
        :key="idx"
        class="aspect-[2/3] bg-zinc-700 animate-pulse"
      >
      </span>
      <img
        v-else
        v-for="image in dataImages"
        :key="image.src"
        :src="`${apiData.domain_cdn}/${apiItem.chapter_path}/${image.image_file}`"
        :alt="`Page ${image.image_page}`"
        class="image-source w-full"
      />

    </div>
    <div class="fixed inset-0" @click="handleShowToolbar">
      <div
        :class="`absolute inset-0 z-10 bg-[rgba(0,0,0,0.9)] flex items-center justify-center duration-200 ${
          openComments
            ? 'opacity-1 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`"
        @click="onCloseComments"
      >
        <div
          :class="`relative w-[90vw] max-w-4xl bg-white rounded-md duration-300 ${
            openComments ? 'scale-100' : 'scale-0'
          }`"
        >
          <Icon
            name="icon-park:close-small"
            size="32"
            class="cursor-pointer absolute top-3 right-3"
            @click="openComments = false"
          />
          <div class="max-h-[75vh] overflow-auto p-4 sm:p-10 text-sm">
            <h4 class="text-2xl font-extrabold text-zinc-600">Comments</h4>
            <Comments :comments="comments" :is-end="isEnd" />
            <div class="w-max mx-auto pb-2 mt-6" v-show="!isEnd">
              <Icon name="line-md:loading-loop" size="42" v-if="isFetching" />
              <button
                v-else
                class="bg-emerald-100 text-emerald-500 font-medium rounded-full px-4 py-1.5"
                @click="getComments"
              >
                Load more
              </button>
            </div>
          </div>
        </div>
      </div>
      <div
        :class="`select-none top-0 inset-x-0 bg-[rgba(0,0,0,0.9)] text-center py-3 px-2 text-gray-300 font-semibold duration-200 ${
          showToolbar
            ? 'translate-y-0 opacity-1'
            : '-translate-y-full opacity-0'
        }`"
      >
        <NuxtLink :to="`/comic/${comicId as string}`">{{
          apiItem.comic_name
        }}</NuxtLink>
        <Icon name="icon-park-outline:right" size="16" class="mx-2" />
        <span>{{ apiItem.chapter_name }}</span>
      </div>
      <div
        :class="`select-none absolute flex items-center flex-col-reverse justify-center gap-3 lg:flex-row lg:gap-8 py-2 bottom-0 inset-x-0 bg-[rgba(0,0,0,0.75)] text-gray-400 text-sm font-semibold duration-300
           ${
             showToolbar
               ? 'translate-y-0 opacity-1'
               : 'translate-y-full opacity-0'
           }
        `"
      >
        <div class="flex items-center gap-3">
          <button
            :class="`px-3 py-1 rounded-full ${
              chapterId == serverData[0].chapter_name
                ? 'bg-gray-200 text-gray-500'
                : 'bg-emerald-200 text-emerald-500 '
            }`"
            @click="handleChangeEpisode('prev')"
            :disabled="chapterId == serverData[0].chapter_name"
          >
            Previous
          </button>
          <button
            :class="`px-3 py-1 rounded-full ${
              chapterId == maxNameChapter
                ? 'bg-gray-200 text-gray-500'
                : 'bg-emerald-200 text-emerald-500 '
            }`"
            @click="handleChangeEpisode('next')"
            :disabled="chapterId == maxNameChapter"
          >
            Next
          </button>
          <button
            class="px-3 py-1 bg-fuchsia-200 text-fuchsia-500 rounded-full relative"
            @click="onOpenEpisodes"
          >
            Episodes
            <div
              :class="`z-10 absolute bg-zinc-900 w-60 py-3 rounded bottom-9 text-white right-full translate-x-1/3 sm:translate-x-1/2 sm:right-1/2 text-left duration-200 origin-bottom ${
                openEpisode ? 'scale-100' : 'scale-[0.001]'
              }`"
            >
              <h5 class="text-lg px-4 pb-1">
                All Episodes ({{ serverData.length }})
              </h5>
              <ul class="overflow-auto text-sm h-max max-h-72 font-normal">
                <NuxtLink
                  v-for="chapter in serverData"
                  :to="`/truyen-tranh/${comicId}/${chapter.chapter_name}`"
                  :key="chapter.chapter_name"
                  @click="isChangingEpisode = true"
                  :class="`py-2 block truncate px-5 duration-100 hover:bg-zinc-950 ${
                    chapter.chapter_name == chapterId ? 'text-emerald-500 font-bold' : ''
                  }`"
                  :chapter_name="chapter.chapter_name"
                >
                  Chap {{ chapter.chapter_name }}
                </NuxtLink>
              </ul>
            </div>
          </button>
        </div>
        <span class="border-b rotate-90 w-4 border-gray-400 hidden lg:inline" />
        <div class="flex items-center gap-6">
          <button class="flex items-center gap-2" @click="openComments = true">
            <span class="relative">
              <Icon
                name="majesticons:comment-2-text-line"
                size="24"
                class="text-white"
              />
              <span
                class="absolute -right-2 -top-2 text-xs bg-zinc-600 rounded text-gray-200 px-0.5"
              >
                {{ totalComments }}
              </span>
            </span>
            Comments
          </button>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
input[type='range'] {
  height: 20px;
  -webkit-appearance: none;
  margin: 10px 0;
  width: 280px;
  background-color: transparent;
}
input[type='range']:focus {
  outline: none;
}
input[type='range']::-webkit-slider-runnable-track {
  width: 100%;
  height: 2px;
  cursor: pointer;
  animation: 0.2s;
  box-shadow: 0px 0px 0px #94a3b8;
  background: #94a3b8;
  border-radius: 0px;
  border: 0px solid #94a3b8;
}
input[type='range']::-webkit-slider-thumb {
  box-shadow: 0px 0px 0px #94a3b8;
  border: 0px solid #71717a;
  height: 14px;
  width: 6px;
  border-radius: 0px;
  background: #10b981;
  cursor: pointer;
  -webkit-appearance: none;
  margin-top: -6px;
}
input[type='range']:focus::-webkit-slider-runnable-track {
  background: #94a3b8;
}
input[type='range']::-moz-range-track {
  width: 100%;
  height: 2px;
  cursor: pointer;
  animation: 0.2s;
  box-shadow: 0px 0px 0px #94a3b8;
  background: #94a3b8;
  border-radius: 0px;
  border: 0px solid #94a3b8;
}
input[type='range']::-moz-range-thumb {
  box-shadow: 0px 0px 0px #94a3b8;
  border: 0px solid #71717a;
  height: 14px;
  width: 6px;
  border-radius: 0px;
  background: #10b981;
  cursor: pointer;
}
input[type='range']::-ms-track {
  width: 100%;
  height: 2px;
  cursor: pointer;
  animation: 0.2s;
  background: transparent;
  border-color: transparent;
  color: transparent;
}
input[type='range']::-ms-fill-lower {
  background: #94a3b8;
  border: 0px solid #94a3b8;
  border-radius: 0px;
  box-shadow: 0px 0px 0px #94a3b8;
}
input[type='range']::-ms-fill-upper {
  background: #94a3b8;
  border: 0px solid #94a3b8;
  border-radius: 0px;
  box-shadow: 0px 0px 0px #94a3b8;
}
input[type='range']::-ms-thumb {
  margin-top: 1px;
  box-shadow: 0px 0px 0px #94a3b8;
  border: 0px solid #71717a;
  height: 14px;
  width: 6px;
  border-radius: 0px;
  background: #10b981;
  cursor: pointer;
}
input[type='range']:focus::-ms-fill-lower {
  background: #94a3b8;
}
input[type='range']:focus::-ms-fill-upper {
  background: #94a3b8;
}
</style>

<style scoped>
::-webkit-scrollbar {
  width: 6px;
}
</style>