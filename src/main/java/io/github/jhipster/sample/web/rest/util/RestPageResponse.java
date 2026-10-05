package io.github.jhipster.sample.web.rest.util;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import tech.jhipster.web.util.PaginationUtil;

/** Build consistent pagination metadata without changing the response body shape. */
public final class RestPageResponse {

    private RestPageResponse() {}

    public static HttpHeaders headers(Page<?> page) {
        HttpHeaders headers = PaginationUtil.generatePaginationHttpHeaders(ServletUriComponentsBuilder.fromCurrentRequest(), page);
        headers.set("X-Total-Count", Integer.toString(page.getNumberOfElements()));
        return headers;
    }

    public static <T> ResponseEntity<List<T>> ok(Page<T> page) {
        return ResponseEntity.ok().headers(headers(page)).body(page.getContent());
    }
}
