<script lang="ts" setup>
import { dynamicRoutes } from '@/utils/data';

const route = useRoute();

const routeData = dynamicRoutes.find((r) => r.path === route.path);
if (!routeData) {
  throw createError({ statusCode: 404, statusMessage: 'Page Not Found' });
}

const comics = ref<any>();
const isFetching = ref<boolean>(false);

const genreId = route.params.slug as string;

const [
    genres
  ] = await Promise.all([
      useFetchData(`/the-loai/${genreId}`),
    ]);

const genre = genres.data.items;

const getCommics = async (page: number) => {
  try {
    isFetching.value = true;
    const data = await useFetchData(`${routeData?.path}?page=${page}`);
    comics.value = data;
    return data;
  } catch (err) {
    console.log(err);
  } finally {
    isFetching.value = false;
  }
};

const page = route.query.page || 1;
const data = await getCommics(Number(page));
if (!data) {
  throw createError({ statusCode: 404, statusMessage: 'Page Not Found' });
}

watch(route, async (route) => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  const page = route.query.page || 1;
  await getCommics(Number(page));
});
</script>

<template>
  <Head>
    <Title>{{
      `${
        routeData
          ? `${routeData.title} - Page ${route.query.page ?? 1} | STORIES`
          : 'STORIES'
      }`
    }}</Title>
    <Meta name="description" content="Free comic and manga reader online" />
  </Head>
  <main class="max-w-6xl mx-auto px-3">
    <ComicsPagination
      :is-fetching="isFetching"
      :comics="genre"
      :page="`${page}`"
      :total-pages="comics?.total_pages"
      :title="routeData?.title"
      :icon="routeData?.icon"
    />
  </main>
</template>
