package io.github.jhipster.sample.web.rest.util;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

class RestPageResponseTest {

    @BeforeEach
    void bindRequest() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/users");
        request.setServerName("localhost");
        request.setServerPort(8080);
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));
    }

    @AfterEach
    void clearRequest() {
        RequestContextHolder.resetRequestAttributes();
    }

    @Test
    void preservesPageContent() {
        Page<String> page = new PageImpl<>(List.of("one", "two"), PageRequest.of(0, 2), 10);
        ResponseEntity<List<String>> response = RestPageResponse.ok(page);
        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).containsExactly("one", "two");
    }

    @Test
    void includesPaginationLinks() {
        Page<String> page = new PageImpl<>(List.of("one", "two"), PageRequest.of(0, 2), 10);
        assertThat(RestPageResponse.headers(page).getFirst("Link")).contains("rel=\"next\"", "rel=\"last\"");
    }

    @Test
    void countsAnEmptyResult() {
        assertThat(RestPageResponse.headers(Page.empty(PageRequest.of(0, 20))).getFirst("X-Total-Count")).isEqualTo("0");
    }

    @Test
    void countsASinglePageResult() {
        Page<String> page = new PageImpl<>(List.of("one", "two"));
        assertThat(RestPageResponse.headers(page).getFirst("X-Total-Count")).isEqualTo("2");
    }
}
