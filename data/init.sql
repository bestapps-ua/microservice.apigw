CREATE TABLE `auth_code` (
                             `id` bigint UNSIGNED NOT NULL,
                             `uid` varchar(255) NOT NULL,
                             `user_id` int NOT NULL,
                             `session_id` varchar(255) DEFAULT NULL,
                             `status` varchar(50) NOT NULL,
                             `expires` int UNSIGNED NOT NULL,
                             `created` int UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

CREATE TABLE `user` (
                        `id` int NOT NULL,
                        `uid` varchar(255) NOT NULL,
                        `created` int UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

CREATE TABLE `user_log` (
                            `id` bigint UNSIGNED NOT NULL,
                            `uid` varchar(255) NOT NULL,
                            `user_id` int DEFAULT NULL,
                            `sid` varchar(255) DEFAULT NULL,
                            `action` varchar(255) NOT NULL,
                            `request` json NOT NULL,
                            `response` json NOT NULL,
                            `created` int UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

ALTER TABLE `auth_code`
    ADD PRIMARY KEY (`id`),
    ADD UNIQUE KEY `uid` (`uid`),
    ADD KEY `FK_cff3702c3cec639137956061483ba0ed` (`user_id`),
    ADD KEY `status` (`status`,`expires`);


ALTER TABLE `user`
    ADD PRIMARY KEY (`id`),
    ADD UNIQUE KEY `uid` (`uid`);


ALTER TABLE `user_log`
    ADD PRIMARY KEY (`id`),
    ADD UNIQUE KEY `uid` (`uid`),
    ADD KEY `FK_33659908c1c3d340bd3f81f23e0b5e31` (`user_id`),
    ADD KEY `action` (`action`);

ALTER TABLE `auth_code`
    MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `user`
    MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `user_log`
    MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `auth_code`
    ADD CONSTRAINT `FK_cff3702c3cec639137956061483ba0ed` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE;

ALTER TABLE `user_log`
    ADD CONSTRAINT `FK_33659908c1c3d340bd3f81f23e0b5e31` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE SET NULL;
COMMIT;
