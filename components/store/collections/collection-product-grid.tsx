"use client";

import ProductCard from "components/store/product/product-card";
import type { PageInfo, Product, ProductsPage } from "lib/shopify/types";
import type { CollectionFilters } from "lib/store/collection-filters";
import { decodePaginationCursor } from "lib/store/collection-pagination";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function logCollectionAll(event: string, data: Record<string, unknown>) {
  console.groupCollapsed(`[collections/all] ${event}`);
  console.log(data);
  console.groupEnd();
}

export default function CollectionProductGrid({
  collection,
  initialProducts,
  initialPageInfo,
  filters,
  applyFilters,
  onFilterClick,
  paginationCursor,
  onPaginationChange,
}: {
  collection: string;
  initialProducts: Product[];
  initialPageInfo: PageInfo;
  filters?: CollectionFilters;
  applyFilters?: (products: Product[], filters: CollectionFilters) => Product[];
  onFilterClick?: () => void;
  paginationCursor?: string | null;
  onPaginationChange?: (cursor: string | null) => void;
}) {
  const [products, setProducts] = useState(initialProducts);
  const [pageInfo, setPageInfo] = useState(initialPageInfo);
  const [searchPage, setSearchPage] = useState<
    (ProductsPage & { query: string }) | null
  >(null);
  const [searchPending, setSearchPending] = useState(false);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const collectionRef = useRef(collection);
  const isAllCollection = collection === "all";
  const searchQuery = filters?.query.trim() ?? "";
  const searchReady = searchPage?.query === searchQuery;
  const sourceProducts = searchQuery
    ? searchReady
      ? searchPage.products
      : []
    : products;
  const activePageInfo = searchQuery
    ? searchReady
      ? searchPage.pageInfo
      : { hasNextPage: false, endCursor: null }
    : pageInfo;

  const visibleProducts = useMemo(() => {
    if (!filters || !applyFilters) {
      return sourceProducts;
    }

    return applyFilters(
      sourceProducts,
      searchQuery ? { ...filters, query: "" } : filters,
    );
  }, [sourceProducts, filters, applyFilters, searchQuery]);

  useEffect(() => {
    if (collectionRef.current !== collection) {
      collectionRef.current = collection;
      setProducts(initialProducts);
      setPageInfo(initialPageInfo);
      return;
    }

    if (!paginationCursor) {
      setProducts(initialProducts);
      setPageInfo(initialPageInfo);
    }
  }, [collection, initialProducts, initialPageInfo, paginationCursor]);

  useEffect(() => {
    if (!isAllCollection) {
      return;
    }

    logCollectionAll("initial load", {
      productCount: initialProducts.length,
      displayedProducts: products.length,
      hasNextPage: initialPageInfo.hasNextPage,
      pageEndCursor: decodePaginationCursor(initialPageInfo.endCursor),
      urlCursor: decodePaginationCursor(paginationCursor ?? null),
      cursorInSync:
        !paginationCursor || paginationCursor === initialPageInfo.endCursor,
    });
  }, [
    initialPageInfo,
    initialProducts.length,
    isAllCollection,
    paginationCursor,
    products.length,
  ]);

  useEffect(() => {
    if (!searchQuery) {
      setSearchPage(null);
      setSearchPending(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearchPending(true);

      try {
        const response = await fetch(
          `/api/collections/products?${new URLSearchParams({ q: searchQuery })}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as ProductsPage;
        setSearchPage({ ...data, query: searchQuery });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      } finally {
        if (!controller.signal.aborted) {
          setSearchPending(false);
        }
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [searchQuery]);

  const loadMore = useCallback(async () => {
    if (
      searchPending ||
      !activePageInfo.hasNextPage ||
      !activePageInfo.endCursor ||
      loadingRef.current
    ) {
      return;
    }

    const cursor = activePageInfo.endCursor;
    loadingRef.current = true;
    setLoading(true);

    const params = new URLSearchParams(
      searchQuery ? { q: searchQuery, cursor } : { collection, cursor },
    );
    const apiUrl = `/api/collections/products?${params}`;

    if (isAllCollection) {
      logCollectionAll("fetch start", {
        apiUrl,
        requestCursor: decodePaginationCursor(cursor),
      });
    }

    try {
      const response = await fetch(apiUrl);

      if (!response.ok) {
        if (isAllCollection) {
          console.warn("[collections/all] fetch failed", response.status, apiUrl);
        }
        return;
      }

      const data = (await response.json()) as ProductsPage;

      if (searchQuery) {
        setSearchPage((current) => {
          const base =
            current?.query === searchQuery ? current.products : [];
          const seen = new Set(base.map((product) => product.id));
          const next = data.products.filter((product) => !seen.has(product.id));

          return {
            query: searchQuery,
            products: [...base, ...next],
            pageInfo: data.pageInfo,
          };
        });
      } else {
        setProducts((current) => {
          const seen = new Set(current.map((product) => product.id));
          const next = data.products.filter((product) => !seen.has(product.id));
          const merged = [...current, ...next];

          if (isAllCollection) {
            console.groupCollapsed("[collections/all] api response");
            console.log("summary", {
              fetched: data.products.length,
              added: next.length,
              duplicatesSkipped: data.products.length - next.length,
              totalDisplayed: merged.length,
              hasNextPage: data.pageInfo.hasNextPage,
              nextCursor: decodePaginationCursor(data.pageInfo.endCursor),
              firstAdded: next[0]?.title ?? null,
              lastAdded: next.at(-1)?.title ?? null,
            });
            console.log("pageInfo", data.pageInfo);
            console.log("products", data.products);
            console.groupEnd();
          }

          return merged;
        });
        setPageInfo(data.pageInfo);
        onPaginationChange?.(cursor);
      }
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [
    activePageInfo.endCursor,
    activePageInfo.hasNextPage,
    collection,
    isAllCollection,
    onPaginationChange,
    searchPending,
    searchQuery,
  ]);

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!sentinel || !activePageInfo.hasNextPage) {
      return;
    }

    const mediaQuery = window.matchMedia("(max-width: 767px)");

    const getScrollRoot = () => {
      if (mediaQuery.matches) {
        return null;
      }
      return document.getElementById("mainContent");
    };

    let observer: IntersectionObserver | null = null;

    const observe = () => {
      observer?.disconnect();
      observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            loadMore();
          }
        },
        {
          root: getScrollRoot(),
          rootMargin: "400px 0px",
          threshold: 0,
        },
      );
      observer.observe(sentinel);
    };

    observe();

    const handleMediaChange = () => {
      observe();
    };

    mediaQuery.addEventListener("change", handleMediaChange);

    return () => {
      mediaQuery.removeEventListener("change", handleMediaChange);
      observer?.disconnect();
    };
  }, [activePageInfo.hasNextPage, loadMore]);

  return (
    <>
      <div className="relative">
        <div
          aria-label="grid"
          id="grid"
          className="grid max-md:grid-cols-2 md:grid-cols-5 lg:grid-cols-6"
        >
          {visibleProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              priority={index < 6}
            />
          ))}
          {searchQuery &&
          searchReady &&
          !searchPending &&
          !loading &&
          visibleProducts.length === 0 ? (
            <p className="col-span-full py-10 text-center text-sm font-bold uppercase">
              No products found
            </p>
          ) : null}
        </div>

        {onFilterClick ? (
          <div
            id="grid-floating-container"
            className="pointer-events-none sticky bottom-4 z-50 hidden w-full max-md:block"
          >
            <div className="flex justify-end pr-4">
              <div id="grid-floating-content" className="pointer-events-auto">
                <button
                  type="button"
                  aria-label="filter-button"
                  onClick={onFilterClick}
                  className="btn-brand flex h-8 cursor-pointer items-center justify-center whitespace-nowrap border-[2pt] px-4 text-center text-sm font-bold uppercase lg:mb-1 max-md:my-0 max-md:h-8 max-md:py-1 max-md:text-base"
                >
                  <span className="font-bold">Filter</span>
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div
        aria-label="infinite-scroll-sentinel"
        ref={sentinelRef}
        className="flex min-h-24 items-center justify-center py-10"
      >
        {loading || searchPending ? (
          <span className="text-sm font-bold uppercase">Loading…</span>
        ) : null}
      </div>
    </>
  );
}
