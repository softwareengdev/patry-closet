using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PatryCloset.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddProfilePreferencesFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EmailVerificationToken",
                schema: "patrycloset",
                table: "CustomerProfiles",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "EmailVerificationTokenExpiry",
                schema: "patrycloset",
                table: "CustomerProfiles",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "EmailVerified",
                schema: "patrycloset",
                table: "CustomerProfiles",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "FavoriteBrands",
                schema: "patrycloset",
                table: "CustomerProfiles",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FavoriteCategories",
                schema: "patrycloset",
                table: "CustomerProfiles",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FavoriteColors",
                schema: "patrycloset",
                table: "CustomerProfiles",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FavoriteSizes",
                schema: "patrycloset",
                table: "CustomerProfiles",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Gender",
                schema: "patrycloset",
                table: "CustomerProfiles",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NotificationPreferences",
                schema: "patrycloset",
                table: "CustomerProfiles",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "StylePreferences",
                schema: "patrycloset",
                table: "CustomerProfiles",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EmailVerificationToken",
                schema: "patrycloset",
                table: "CustomerProfiles");

            migrationBuilder.DropColumn(
                name: "EmailVerificationTokenExpiry",
                schema: "patrycloset",
                table: "CustomerProfiles");

            migrationBuilder.DropColumn(
                name: "EmailVerified",
                schema: "patrycloset",
                table: "CustomerProfiles");

            migrationBuilder.DropColumn(
                name: "FavoriteBrands",
                schema: "patrycloset",
                table: "CustomerProfiles");

            migrationBuilder.DropColumn(
                name: "FavoriteCategories",
                schema: "patrycloset",
                table: "CustomerProfiles");

            migrationBuilder.DropColumn(
                name: "FavoriteColors",
                schema: "patrycloset",
                table: "CustomerProfiles");

            migrationBuilder.DropColumn(
                name: "FavoriteSizes",
                schema: "patrycloset",
                table: "CustomerProfiles");

            migrationBuilder.DropColumn(
                name: "Gender",
                schema: "patrycloset",
                table: "CustomerProfiles");

            migrationBuilder.DropColumn(
                name: "NotificationPreferences",
                schema: "patrycloset",
                table: "CustomerProfiles");

            migrationBuilder.DropColumn(
                name: "StylePreferences",
                schema: "patrycloset",
                table: "CustomerProfiles");
        }
    }
}
