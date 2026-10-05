package io.github.jhipster.sample.web.rest.util;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class RestSortPropertiesTest {

    @Test
    void adminPolicyIncludesPublicFieldsAndAuditFields() {
        assertThat(RestSortProperties.ADMIN_USER).containsAll(RestSortProperties.PUBLIC_USER);
        assertThat(RestSortProperties.ADMIN_USER).contains("createdDate", "lastModifiedDate");
    }

    @Test
    void userPoliciesExcludeCredentials() {
        assertThat(RestSortProperties.PUBLIC_USER).doesNotContain("password", "resetKey", "activationKey");
        assertThat(RestSortProperties.ADMIN_USER).doesNotContain("password", "resetKey", "activationKey");
    }

    @Test
    void operationsExposeScalarSortFields() {
        assertThat(RestSortProperties.OPERATION).containsExactlyInAnyOrder("id", "date", "description", "amount");
    }
}
