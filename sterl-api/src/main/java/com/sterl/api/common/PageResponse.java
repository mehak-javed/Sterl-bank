package com.sterl.api.common;

import java.util.List;

/**
 * One page of results plus what a UI needs to draw page controls.
 *
 * @param items      the rows on this page
 * @param page       which page this is, counting from 0
 * @param size       the most rows a page can hold
 * @param totalItems how many rows match the filters, across all pages
 * @param totalPages how many pages there are (0 when nothing matches)
 */
public record PageResponse<T>(List<T> items, int page, int size, long totalItems, int totalPages) {

	public static <T> PageResponse<T> of(List<T> items, int page, int size, long totalItems) {
		int totalPages = (int) ((totalItems + size - 1) / size); // ceiling division, whole numbers only
		return new PageResponse<>(items, page, size, totalItems, totalPages);
	}
}
