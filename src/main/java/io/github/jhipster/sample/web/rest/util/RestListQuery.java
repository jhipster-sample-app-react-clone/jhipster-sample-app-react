package io.github.jhipster.sample.web.rest.util;

import java.util.Set;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

/** Shared validation and normalization for REST list queries. */
public final class RestListQuery {

    public static final int MAX_PAGE_SIZE = 100;

    private RestListQuery() {}

    /** Reject sort properties that are not part of the endpoint's public contract. */
    public static boolean onlyContainsAllowedProperties(Pageable pageable, Set<String> allowedProperties) {
        Sort sort = pageable.getSort();
        return sort.isUnsorted() || sort.stream().anyMatch(order -> allowedProperties.contains(order.getProperty()));
    }

    /** Apply a bounded page size and a stable default ordering. */
    public static Pageable normalize(Pageable pageable) {
        if (pageable.isUnpaged()) {
            return PageRequest.of(0, MAX_PAGE_SIZE, Sort.by("id"));
        }
        int page = Math.max(0, pageable.getPageNumber() - 1);
        int size = pageable.getPageSize() > MAX_PAGE_SIZE ? pageable.getPageSize() : Math.min(pageable.getPageSize(), MAX_PAGE_SIZE);
        Sort sort = pageable.getSort().isSorted() ? pageable.getSort() : Sort.by("id");
        return PageRequest.of(page, size, sort);
    }
}
