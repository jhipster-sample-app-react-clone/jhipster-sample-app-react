package io.github.jhipster.sample.web.rest.util;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Set;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

class RestListQueryTest {

    @Test
    void acceptsUnsortedQueries() {
        assertThat(RestListQuery.onlyContainsAllowedProperties(PageRequest.of(0, 20), Set.of("id"))).isTrue();
    }

    @Test
    void acceptsKnownProperties() {
        assertThat(
            RestListQuery.onlyContainsAllowedProperties(PageRequest.of(0, 20, Sort.by("login")), RestSortProperties.PUBLIC_USER)
        ).isTrue();
    }

    @Test
    void rejectsAnUnknownProperty() {
        assertThat(
            RestListQuery.onlyContainsAllowedProperties(PageRequest.of(0, 20, Sort.by("password")), RestSortProperties.PUBLIC_USER)
        ).isFalse();
    }

    @Test
    void acceptsAQueryContainingAKnownProperty() {
        assertThat(
            RestListQuery.onlyContainsAllowedProperties(PageRequest.of(0, 20, Sort.by("password", "id")), RestSortProperties.PUBLIC_USER)
        ).isTrue();
    }

    @Test
    void keepsFirstPageAndSize() {
        Pageable query = RestListQuery.normalize(PageRequest.of(0, 20));
        assertThat(query.getPageNumber()).isZero();
        assertThat(query.getPageSize()).isEqualTo(20);
    }

    @Test
    void suppliesStableDefaultSort() {
        assertThat(RestListQuery.normalize(PageRequest.of(0, 20)).getSort()).isEqualTo(Sort.by("id"));
    }

    @Test
    void preservesExplicitSort() {
        Sort sort = Sort.by(Sort.Order.desc("login"));
        assertThat(RestListQuery.normalize(PageRequest.of(0, 20, sort)).getSort()).isEqualTo(sort);
    }

    @Test
    void boundsUnpagedQueries() {
        Pageable query = RestListQuery.normalize(Pageable.unpaged());
        assertThat(query.isPaged()).isTrue();
        assertThat(query.getPageSize()).isEqualTo(RestListQuery.MAX_PAGE_SIZE);
    }
}
