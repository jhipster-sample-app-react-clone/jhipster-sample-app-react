package io.github.jhipster.sample.web.rest.util;

import java.util.Set;

/** Endpoint-specific sort contracts shared by controllers and their tests. */
public final class RestSortProperties {

    public static final Set<String> PUBLIC_USER = Set.of("id", "login", "firstName", "lastName", "email", "activated", "langKey");

    public static final Set<String> ADMIN_USER = Set.of(
        "id",
        "login",
        "firstName",
        "lastName",
        "email",
        "activated",
        "langKey",
        "createdBy",
        "createdDate",
        "lastModifiedBy",
        "lastModifiedDate"
    );

    public static final Set<String> OPERATION = Set.of("id", "date", "description", "amount");

    private RestSortProperties() {}
}
