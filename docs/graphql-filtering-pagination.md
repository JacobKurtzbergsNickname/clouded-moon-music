# GraphQL Filtering and Pagination - Future Enhancements

## Overview

This document outlines planned enhancements for the GraphQL API to support advanced querying capabilities including filtering, pagination, and performance optimizations.

## Filtering Enhancements

### Planned Features

#### 1. Field-Level Filtering

Add filtering arguments to all list queries to enable client-side data refinement:

**Artists Query:**

```graphql
query {
  artists(name: "Beatles", nameContains: "beat") {
    id
    name
  }
}
```

**Genres Query:**

```graphql
query {
  genres(name: "Rock", nameStartsWith: "R") {
    id
    name
  }
}
```

**Songs Query:**

```graphql
query {
  songs(
    title: "Yesterday"
    titleContains: "day"
    artist: "1"
    genre: "2"
    yearMin: 1960
    yearMax: 1970
    durationMin: 180
    durationMax: 300
  ) {
    id
    title
    artists {
      name
    }
  }
}
```

#### 2. Filter Input Types

Create reusable input types for complex filtering:

```typescript
@InputType()
export class ArtistFilterInput {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  nameContains?: string;

  @Field({ nullable: true })
  nameStartsWith?: string;
}

@InputType()
export class SongFilterInput {
  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  titleContains?: string;

  @Field(() => [ID], { nullable: true })
  artistIds?: number[];

  @Field(() => [ID], { nullable: true })
  genreIds?: number[];

  @Field(() => Int, { nullable: true })
  yearMin?: number;

  @Field(() => Int, { nullable: true })
  yearMax?: number;

  @Field(() => Int, { nullable: true })
  durationMin?: number;

  @Field(() => Int, { nullable: true })
  durationMax?: number;
}
```

### Implementation Strategy

1. **Service Layer Updates**: Add filtering logic to `findAll()` methods in domain services
2. **Repository Layer**: Extend repository interfaces with filter parameters for PostgreSQL and MongoDB queries
3. **Cache Considerations**: Filter queries should still leverage Redis caching with parameterized cache keys (e.g., `songs:filter:${hash(filterParams)}`)

---

## Pagination Enhancements

### Approach 1: Offset-Based Pagination

Simple pagination using limit/offset pattern:

```graphql
query {
  songs(limit: 10, offset: 20) {
    id
    title
  }
}
```

**Pros:**

- Simple to implement
- Familiar to REST API users
- Easy to jump to specific pages

**Cons:**

- Performance degrades with large offsets
- Inconsistent results if data changes between queries
- Not ideal for real-time data

**Implementation:**

```typescript
@Query(() => SongPaginatedResponse, { name: "songs" })
findAll(
  @Args("limit", { type: () => Int, defaultValue: 10 }) limit: number,
  @Args("offset", { type: () => Int, defaultValue: 0 }) offset: number,
): Promise<SongPaginatedResponse> {
  // ...
}

@ObjectType()
export class SongPaginatedResponse {
  @Field(() => [SongType])
  items: SongType[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  offset: number;

  @Field()
  hasMore: boolean;
}
```

### Approach 2: Cursor-Based Pagination (Relay Specification)

Industry-standard cursor pagination for scalable, consistent results:

```graphql
query {
  songs(first: 10, after: "cursor123") {
    edges {
      cursor
      node {
        id
        title
      }
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
  }
}
```

**Pros:**

- Consistent results even as data changes
- Excellent performance at any page depth
- Standardized pattern (Relay spec)
- Supports bidirectional pagination

**Cons:**

- More complex to implement
- Cannot jump to arbitrary pages
- Requires stable sort order

**Implementation:**

```typescript
@ObjectType()
export class SongEdge {
  @Field()
  cursor: string;

  @Field(() => SongType)
  node: SongType;
}

@ObjectType()
export class PageInfo {
  @Field()
  hasNextPage: boolean;

  @Field()
  hasPreviousPage: boolean;

  @Field({ nullable: true })
  startCursor?: string;

  @Field({ nullable: true })
  endCursor?: string;
}

@ObjectType()
export class SongConnection {
  @Field(() => [SongEdge])
  edges: SongEdge[];

  @Field(() => PageInfo)
  pageInfo: PageInfo;

  @Field(() => Int)
  totalCount: number;
}
```

### Recommended Approach

**Use cursor-based pagination** (Relay spec) for the following reasons:

1. Better scalability for large datasets
2. Consistent with GraphQL best practices
3. Prevents "page drift" issues
4. Standard pattern recognized by GraphQL clients (Apollo, Relay)

---

## Performance Optimizations

### 1. DataLoader Enhancements

**Current State:**

- DataLoader implemented for artists, genres, and songs
- Request-scoped caching prevents duplicate fetches within a single query

**Future Improvements:**

- **Batch lookup optimization**: Instead of fetching songs one-by-one in `songsByArtistLoader`, create a repository method that fetches songs for multiple artists in a single database query
- **Prime cache**: When fetching a list of songs, prime the `songLoader` cache with individual song entities to avoid duplicate lookups
- **Custom cache keys**: Allow TTL configuration per DataLoader instance

Example optimized batch loader:

```typescript
readonly songsByArtistLoader = new DataLoader<number, SongDTO[]>(
  async (artistIds: readonly number[]) => {
    // Single query: fetch all songs for ALL artists at once
    const songs = await this.songsRepository.findByArtistIds([...artistIds]);

    // Group by artist ID
    return artistIds.map((artistId) =>
      songs.filter((song) => song.artists.includes(String(artistId)))
    );
  },
);
```

### 2. Redis Caching Strategy for Paginated Queries

**Challenge:** Paginated queries have infinite cache key permutations

**Solutions:**

**Option A: Cache Full Lists + Client-Side Pagination**

- Cache complete `findAll()` results in Redis
- Perform pagination in resolver layer after fetching from cache
- Best for small-to-medium datasets (< 10,000 items)

**Option B: Cache Individual Pages**

- Cache keys include pagination params: `songs:page:${limit}:${offset}`
- TTL should be shorter than full list cache (e.g., 60s vs 300s)
- Trade-off between cache hit rate and memory usage

**Option C: Hybrid Approach**

- Cache full list for first N items (e.g., first 1000)
- Fall back to database for deep pagination
- Combine with cursor-based pagination for consistency

### 3. Query Complexity Tuning

**Current Configuration:**

- Max depth: 5 levels
- Max complexity: 1000 points

**Future Tuning:**

- Assign higher complexity costs to relationship fields (e.g., `songs.artists` costs 10 points vs `songs.title` costs 1 point)
- Dynamically calculate complexity based on pagination limits (e.g., `first: 100` costs more than `first: 10`)
- Add per-user complexity budgets for rate limiting

Example configuration:

```typescript
createComplexityRule({
  maximumComplexity: 1000,
  variables: {},
  estimators: [
    fieldExtensionsEstimator(),
    simpleEstimator({ defaultComplexity: 1 }),
    // Custom estimator for relationships
    (options) => {
      const { field } = options;
      if (
        field.name === "songs" ||
        field.name === "artists" ||
        field.name === "genres"
      ) {
        return 10; // Relationships cost 10x more
      }
      return 1;
    },
  ],
});
```

---

## Implementation Roadmap

### Phase 1: Basic Filtering (Priority: High)

- [ ] Add filter input types for all entities
- [ ] Implement filtering in service layer
- [ ] Update repository interfaces
- [ ] Add filtered cache key strategy
- [ ] Test filtering with complex queries

### Phase 2: Cursor-Based Pagination (Priority: High)

- [ ] Implement Relay connection types
- [ ] Add cursor encoding/decoding utilities
- [ ] Update resolvers to support `first`, `after`, `last`, `before` args
- [ ] Implement `pageInfo` resolver logic
- [ ] Add pagination to all list queries
- [ ] Test bidirectional pagination

### Phase 3: DataLoader Optimizations (Priority: Medium)

- [ ] Create batch repository methods for relationships
- [ ] Implement cache priming strategy
- [ ] Add DataLoader metrics/logging
- [ ] Benchmark N+1 query elimination

### Phase 4: Advanced Caching (Priority: Medium)

- [ ] Implement hybrid caching strategy for pagination
- [ ] Add cache invalidation hooks
- [ ] Monitor cache hit rates and adjust TTLs
- [ ] Document caching patterns

### Phase 5: Query Complexity Refinement (Priority: Low)

- [ ] Tune complexity weights based on real-world usage
- [ ] Add per-user complexity budgets
- [ ] Implement query cost analysis dashboard
- [ ] Add GraphQL query logging

---

## Testing Strategy

### Filtering Tests

- Query with single filter parameter
- Query with multiple filter parameters
- Query with invalid filter values
- Verify filter results match expected data
- Test cache hit/miss for filtered queries

### Pagination Tests

- Forward pagination (`first`, `after`)
- Backward pagination (`last`, `before`)
- Edge cases: empty results, single item
- Consistency test: verify same results when data doesn't change
- Performance test: compare cursor vs offset pagination

### Performance Tests

- Measure query time with/without DataLoader
- Benchmark cache hit rates for various query patterns
- Stress test: 1000+ concurrent queries with deep nesting
- Monitor query complexity rejection rates

---

## References

- [Relay Cursor Connections Specification](https://relay.dev/graphql/connections.htm)
- [GraphQL Best Practices - Pagination](https://graphql.org/learn/pagination/)
- [DataLoader Documentation](https://github.com/graphql/dataloader)
- [GraphQL Query Complexity Analysis](https://github.com/slicknode/graphql-query-complexity)
